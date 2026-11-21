"""Downtime alarm for the website. Runs on GitHub's computers every few minutes (no PC needed).

- Checks each address in SITES (secure https, real page content).
- Only calls it "down" after 3 failed checks about 45 seconds apart (no false alarms from one blip).
- Down: Pushover emergency alarm that repeats until acknowledged (repeated every 3 hours while still down).
- Back up: cancels the repeating alarm and sends one normal "back up" message.
- Remembers whether the site is down in a small file on the `uptime-state` branch (not the live site).
Secrets PUSHOVER_USER and PUSHOVER_TOKEN are entered by the owner in GitHub; this script never prints them.
Nothing private is printed: the workflow logs of a public repository are public.
"""
import base64, json, os, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone

SITES = [s.strip() for s in os.environ.get("SITES", "").split(",") if s.strip()]
MUST_CONTAIN = os.environ.get("MUST_CONTAIN", "")
NAME = os.environ.get("SITE_NAME", "the website")
USER, TOKEN = os.environ.get("PUSHOVER_USER", ""), os.environ.get("PUSHOVER_TOKEN", "")
GH, REPO = os.environ.get("GH_TOKEN", ""), os.environ.get("REPO", "")
TEST = os.environ.get("TEST_ALARM", "").lower() in ("yes", "true", "1")
BRANCH, PATH = "uptime-state", "state.json"
REALARM_SECONDS = 3 * 3600


def now():
    return datetime.now(timezone.utc)


def pushover(title, message, priority=0, url=None):
    data = {"token": TOKEN, "user": USER, "title": title, "message": message, "priority": priority}
    if priority == 2:
        data.update(retry=120, expire=10800, sound="siren")   # repeat every 2 min, up to 3 h, until acknowledged
    if url:
        data.update(url=url, url_title="Open the site")
    req = urllib.request.Request("https://api.pushover.net/1/messages.json", urllib.parse.urlencode(data).encode())
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r).get("receipt")


def cancel(receipt):
    if not receipt:
        return
    try:
        req = urllib.request.Request(f"https://api.pushover.net/1/receipts/{receipt}/cancel.json",
                                     urllib.parse.urlencode({"token": TOKEN}).encode())
        urllib.request.urlopen(req, timeout=20).read()
    except Exception:
        pass


def check_once(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "site-uptime-check (GitHub Actions)", "Cache-Control": "no-cache"})
        with urllib.request.urlopen(req, timeout=25) as r:
            body = r.read(400000).decode("utf-8", "replace")
            if r.status != 200:
                return f"status {r.status}"
            if MUST_CONTAIN and MUST_CONTAIN not in body:
                return "page content missing"
            return None
    except urllib.error.HTTPError as e:
        return f"status {e.code}"
    except Exception as e:
        return type(e).__name__ + (": certificate problem" if "CERTIFICATE" in str(e).upper() else "")


def site_problem(url):
    problem = None
    for attempt in range(3):
        problem = check_once(url)
        if problem is None:
            return None
        if attempt < 2:
            time.sleep(45)
    return problem


def gh(method, path, body=None):
    req = urllib.request.Request(f"https://api.github.com/repos/{REPO}{path}", method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Bearer {GH}", "Accept": "application/vnd.github+json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def load_state():
    f = gh("GET", f"/contents/{PATH}?ref={BRANCH}")
    if not f:
        return {"down": False, "incidents": []}, None
    return json.loads(base64.b64decode(f["content"])), f["sha"]


def save_state(state, sha):
    if not gh("GET", f"/branches/{BRANCH}"):
        main = gh("GET", "/git/ref/heads/main")
        gh("POST", "/git/refs", {"ref": f"refs/heads/{BRANCH}", "sha": main["object"]["sha"]})
    body = {"message": "Uptime state: " + ("down" if state["down"] else "up"), "branch": BRANCH,
            "content": base64.b64encode(json.dumps(state, indent=1).encode()).decode()}
    if sha:
        body["sha"] = sha
    gh("PUT", f"/contents/{PATH}", body)


def main():
    if not (USER and TOKEN):
        print("Pushover secrets not added yet; skipping the check.")
        return
    if TEST:
        r = pushover(f"TEST: {NAME} is down", "This is a test of the downtime alarm. Acknowledge it in Pushover to stop it repeating.", 2, SITES[0])
        print("Test alarm sent. Waiting 60 seconds before the test 'back up' message.")
        time.sleep(60)
        pushover(f"TEST: {NAME} is back up", "Test finished. Real alarms work the same way.", 0, SITES[0])
        return

    problems = {u: p for u in SITES if (p := site_problem(u))}
    state, sha = load_state()
    t = now()
    if problems:
        detail = "; ".join(f"{u} ({p})" for u, p in problems.items())
        last = state.get("alarmed_at")
        due = not state["down"] or not last or (t - datetime.fromisoformat(last)).total_seconds() > REALARM_SECONDS
        print("DOWN:", ", ".join(problems))
        if due:
            receipt = pushover(f"{NAME} is DOWN", f"Not loading: {detail}. Checked 3 times over 2 minutes.", 2, SITES[0])
            if not state["down"]:
                state["since"] = t.isoformat()
            state.update(down=True, alarmed_at=t.isoformat(), receipt=receipt)
            save_state(state, sha)
    else:
        print("UP:", ", ".join(SITES))
        if state["down"]:
            since = datetime.fromisoformat(state["since"])
            minutes = round((t - since).total_seconds() / 60)
            cancel(state.get("receipt"))
            pushover(f"{NAME} is back up", f"The site is loading again. It was down for about {minutes} minutes.", 0, SITES[0])
            state["incidents"] = (state.get("incidents", []) + [{"start": state["since"], "end": t.isoformat(), "minutes": minutes}])[-50:]
            state.update(down=False, since=None, alarmed_at=None, receipt=None)
            save_state(state, sha)


main()
