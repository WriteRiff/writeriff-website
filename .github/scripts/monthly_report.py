"""Monthly website report, sent to the owner's phone by Pushover on the 1st of each month.
Runs on GitHub's computers (no PC needed, nobody has to start it).

Contents: visits and page views (last month vs the month before), top pages, how people found the site
(the sites that linked to it, from Cloudflare Web Analytics), phone vs computer, downtime last month,
broken links, security certificate and domain renewal dates.
Google's own monthly Search Console email covers what people searched for on Google.

Never asks visitors anything. Prints nothing private: the logs of a public repository are public.
Secrets (entered by the owner in GitHub, never printed): PUSHOVER_USER, PUSHOVER_TOKEN, CF_API_TOKEN.
"""
import base64, html, json, os, re, socket, ssl, urllib.error, urllib.parse, urllib.request
from datetime import date, datetime, time, timedelta, timezone

SITE = os.environ["SITE_URL"].rstrip("/") + "/"
HOST = urllib.parse.urlparse(SITE).hostname
NAME = os.environ.get("SITE_NAME", HOST)
CF_ACCOUNT, CF_SITE = os.environ.get("CF_ACCOUNT", ""), os.environ.get("CF_SITE_TAG", "")
CF_TOKEN = os.environ.get("CF_API_TOKEN", "")
USER, TOKEN = os.environ.get("PUSHOVER_USER", ""), os.environ.get("PUSHOVER_TOKEN", "")
GH, REPO = os.environ.get("GH_TOKEN", ""), os.environ.get("REPO", "")
UA = {"User-Agent": "monthly-site-report (GitHub Actions)"}


def get(url, headers=None, data=None, timeout=25):
    req = urllib.request.Request(url, data=data, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read()


def month_bounds(today):
    first_this = today.replace(day=1)
    last_end = first_this
    last_start = (first_this - timedelta(days=1)).replace(day=1)
    prev_start = (last_start - timedelta(days=1)).replace(day=1)
    return prev_start, last_start, last_end


def lookup_site_tag():
    _, body = get(f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT}/rum/site_info/list?per_page=100",
                  {"Authorization": f"Bearer {CF_TOKEN}"})
    data = json.loads(body)
    if data.get("success") is False:
        return None
    hosts = {HOST, f"www.{HOST}"}
    for site in data.get("result") or []:
        tag = site.get("site_tag")
        if not tag:
            continue
        host = site.get("host")
        if host:
            if host in hosts:
                return tag
            continue
        # Cloudflare also lists hostnames in analytics rules and zone names in rulesets.
        if any(rule.get("host") in hosts and rule.get("inclusive", True)
               for rule in site.get("rules") or []):
            return tag
        if (site.get("ruleset") or {}).get("zone_name") in hosts:
            return tag
    return None


def cf(start, end, site_tag):
    q = """query($a:String!,$s:String!,$from:Time!,$to:Time!){viewer{accounts(filter:{accountTag:$a}){
      total:rumPageloadEventsAdaptiveGroups(limit:1,filter:{siteTag:$s,datetime_geq:$from,datetime_lt:$to}){count sum{visits}}
      pages:rumPageloadEventsAdaptiveGroups(limit:5,orderBy:[count_DESC],filter:{siteTag:$s,datetime_geq:$from,datetime_lt:$to}){count dimensions{requestPath}}
      refs:rumPageloadEventsAdaptiveGroups(limit:6,orderBy:[sum_visits_DESC],filter:{siteTag:$s,datetime_geq:$from,datetime_lt:$to}){sum{visits} dimensions{refererHost}}
      devices:rumPageloadEventsAdaptiveGroups(limit:4,orderBy:[sum_visits_DESC],filter:{siteTag:$s,datetime_geq:$from,datetime_lt:$to}){sum{visits} dimensions{deviceType}}
    }}}"""
    var = {"a": CF_ACCOUNT, "s": site_tag, "from": f"{start}T00:00:00Z", "to": f"{end}T00:00:00Z"}
    _, body = get("https://api.cloudflare.com/client/v4/graphql",
                  {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"},
                  json.dumps({"query": q, "variables": var}).encode())
    j = json.loads(body)
    if j.get("errors"):
        raise RuntimeError("Cloudflare: " + j["errors"][0].get("message", "error")[:80])
    return j["data"]["viewer"]["accounts"][0]


def visitors_section(prev_start, last_start, last_end):
    if not (CF_TOKEN and CF_ACCOUNT):
        return ["<b>Visitors</b>: not set up yet (needs the Cloudflare token in GitHub)."]
    try:
        site_tag = CF_SITE or lookup_site_tag()
    except Exception:
        site_tag = None
    if not site_tag:
        return [f"<b>Visitors</b>: couldn't find {html.escape(HOST)} in Cloudflare Web Analytics."]
    try:
        now_, before = cf(last_start, last_end, site_tag), cf(prev_start, last_start, site_tag)
    except Exception as e:
        return [f"<b>Visitors</b>: couldn't read Cloudflare ({html.escape(type(e).__name__)})."]
    t = now_["total"][0] if now_["total"] else {"count": 0, "sum": {"visits": 0}}
    b = before["total"][0] if before["total"] else {"count": 0, "sum": {"visits": 0}}
    out = [f"<b>Visitors</b>: {html.escape(str(t['sum']['visits']))} visits, "
           f"{html.escape(str(t['count']))} page views (month before: {html.escape(str(b['sum']['visits']))} visits)"]
    pages = ", ".join(html.escape(f"{p['dimensions']['requestPath']} {p['count']}") for p in now_["pages"])
    if pages:
        out.append(f"<b>Top pages</b>: {pages}")
    refs = []
    for r in now_["refs"]:
        h = r["dimensions"]["refererHost"] or "typed in / bookmark"
        if h == HOST or h.endswith("." + HOST):
            continue
        refs.append(html.escape(f"{h} {r['sum']['visits']}"))
    if refs:
        out.append(f"<b>How people found it</b>: {', '.join(refs[:5])}")
    dev = ", ".join(html.escape(f"{d['dimensions']['deviceType']} {d['sum']['visits']}") for d in now_["devices"])
    if dev:
        out.append(f"<b>Devices</b>: {dev}")
    return out


def downtime_section(last_start, last_end):
    month_start = datetime.combine(last_start, time.min, tzinfo=timezone.utc)
    month_end = datetime.combine(last_end, time.min, tzinfo=timezone.utc)
    try:
        _, body = get(f"https://api.github.com/repos/{REPO}/contents/state.json?ref=uptime-state",
                      {"Authorization": f"Bearer {GH}", "Accept": "application/vnd.github+json"})
        state = json.loads(base64.b64decode(json.loads(body)["content"]))
        intervals = [(datetime.fromisoformat(i["start"]), datetime.fromisoformat(i["end"]))
                     for i in state.get("incidents", [])]
        if state.get("down") and state.get("since"):
            intervals.append((datetime.fromisoformat(state["since"]), datetime.now(timezone.utc)))
        overlaps = [min(end, month_end) - max(start, month_start) for start, end in intervals]
    except Exception:
        return "<b>Downtime</b>: couldn't read the record."
    seconds = [overlap.total_seconds() for overlap in overlaps if overlap > timedelta(0)]
    if not seconds:
        return "<b>Downtime</b>: none." + (" (Down right now!)" if state.get("down") else "")
    return f"<b>Downtime</b>: {len(seconds)} time(s), {round(sum(seconds) / 60)} minutes in all."


def broken_links():
    try:
        _, sm = get(SITE + "sitemap.xml")
        pages = re.findall(r"<loc>([^<]+)</loc>", sm.decode())
    except Exception:
        return "<b>Broken links</b>: couldn't read the sitemap."
    seen, bad = set(), []
    for p in pages:
        try:
            _, page_html = get(p)
        except Exception:
            bad.append(urllib.parse.urlparse(p).path)
            continue
        for link in re.findall(r'(?:href|src)="([^"#]+)', page_html.decode("utf-8", "replace")):
            u = urllib.parse.urljoin(p, link)
            if urllib.parse.urlparse(u).hostname != HOST or u in seen:
                continue
            seen.add(u)
            try:
                get(u, timeout=20)
            except urllib.error.HTTPError as e:
                bad.append(f"{urllib.parse.urlparse(u).path} ({e.code})")
            except Exception:
                bad.append(urllib.parse.urlparse(u).path)
    if not bad:
        return f"<b>Broken links</b>: none ({len(seen)} checked)."
    return f"<b>Broken links</b>: {len(bad)}: " + html.escape(", ".join(bad[:5]))


def cert_date():
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((HOST, 443), timeout=15) as s, ctx.wrap_socket(s, server_hostname=HOST) as t:
            end = datetime.strptime(t.getpeercert()["notAfter"], "%b %d %H:%M:%S %Y %Z").date()
        return f"<b>Security certificate</b>: OK until {html.escape(end.strftime('%b %d, %Y'))} (GitHub renews it automatically)."
    except Exception as e:
        return f"<b>Security certificate</b>: PROBLEM ({html.escape(type(e).__name__)}). Check the site."


def domain_date():
    try:
        _, body = get(f"https://rdap.verisign.com/com/v1/domain/{HOST}")
        ev = {e["eventAction"]: e["eventDate"][:10] for e in json.loads(body).get("events", [])}
        end = date.fromisoformat(ev["expiration"])
        days = (end - date.today()).days
        warn = " RENEW SOON: check GoDaddy auto-renew." if days < 45 else ""
        return f"<b>Domain</b>: registered until {html.escape(end.strftime('%b %d, %Y'))} ({days} days).{warn}"
    except Exception:
        return "<b>Domain</b>: couldn't look up the renewal date."


def keep_schedules_alive():
    # GitHub pauses scheduled jobs in public repositories after 60 days without activity; re-enabling resets that.
    for wf in ("uptime.yml", "monthly-report.yml"):
        try:
            req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/actions/workflows/{wf}/enable", method="PUT",
                                         headers={"Authorization": f"Bearer {GH}", "Accept": "application/vnd.github+json"})
            urllib.request.urlopen(req, timeout=20).read()
        except Exception:
            print("Couldn't refresh schedule for", wf)


def main():
    keep_schedules_alive()
    if not (USER and TOKEN):
        print("Pushover secrets not added yet; report not sent.")
        return
    prev_start, last_start, last_end = month_bounds(date.today())
    lines = visitors_section(prev_start, last_start, last_end)
    lines += [downtime_section(last_start, last_end), broken_links(), cert_date(), domain_date(),
              "Google's own Search Console email shows what people searched for."]
    msg = "\n".join(lines)
    if len(msg) > 1024:
        msg = msg[:1020] + "…"
    data = urllib.parse.urlencode({"token": TOKEN, "user": USER, "html": 1, "priority": 0,
                                   "title": f"{NAME}: {last_start:%B} report", "message": msg,
                                   "url": "https://dash.cloudflare.com/?to=/:account/web-analytics", "url_title": "Full numbers in Cloudflare"}).encode()
    urllib.request.urlopen(urllib.request.Request("https://api.pushover.net/1/messages.json", data), timeout=20).read()
    print("Report sent.")


if __name__ == "__main__":
    main()
