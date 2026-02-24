"""
Fortytwo Swarm Monitor - Polls for new queries and judging challenges.
Outputs actions needed so the parent process can act on them.
"""
import json
import urllib.request
import time
import sys
import base64

BASE_URL = "https://app.fortytwo.network/api"
AGENT_ID = "04bc0c37-3ced-427a-bd57-42fb080185a1"
SECRET = "J-1KD5krK4vng6KhBJxbR090l9G38GhVMDO6XvS65vM"
TOKEN_FILE = "C:/Users/DELL/Desktop/crabdao-agent/fortytwo_tokens.json"

access_token = None
refresh_token_val = None
answered_queries = set()
judged_challenges = set()

def load_tokens():
    global access_token, refresh_token_val
    try:
        with open(TOKEN_FILE, encoding="utf-8") as f:
            data = json.load(f)
        access_token = data["tokens"]["access_token"]
        refresh_token_val = data["tokens"]["refresh_token"]
    except:
        do_login()

def save_tokens():
    with open(TOKEN_FILE, "w") as f:
        json.dump({"agent_id": AGENT_ID, "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token_val,
            "token_type": "bearer", "expires_in": 900
        }}, f, indent=2)

def api(method, path, data=None):
    global access_token, refresh_token_val
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        try:
            return json.loads(err), e.code
        except:
            return {"detail": err}, e.code

def do_login():
    global access_token, refresh_token_val
    r, c = api("POST", "/auth/login", {"agent_id": AGENT_ID, "secret": SECRET})
    if c == 200:
        access_token = r["tokens"]["access_token"]
        refresh_token_val = r["tokens"]["refresh_token"]
        save_tokens()
        return True
    return False

def ensure_auth():
    global access_token, refresh_token_val
    r, c = api("POST", "/auth/refresh", {"refresh_token": refresh_token_val})
    if c == 200:
        access_token = r["tokens"]["access_token"]
        refresh_token_val = r["tokens"]["refresh_token"]
        save_tokens()
        return True
    return do_login()

def safe_api(method, path, data=None):
    r, c = api(method, path, data)
    if c == 401:
        ensure_auth()
        r, c = api(method, path, data)
    return r, c

def check_and_report():
    # Check active queries
    queries, _ = safe_api("GET", "/queries/active?page=1&page_size=20")
    new_queries = []
    for q in queries.get("queries", []):
        qid = q["id"]
        if qid not in answered_queries:
            new_queries.append(q)

    # Check pending judging
    judging, _ = safe_api("GET", f"/rankings/pending/{AGENT_ID}?page=1&page_size=20")
    new_challenges = []
    for c in judging.get("challenges", []):
        cid = c["id"]
        if cid not in judged_challenges and not c.get("has_voted", False):
            new_challenges.append(c)

    # Balance
    balance, _ = safe_api("GET", f"/economy/balance/{AGENT_ID}")

    return {
        "balance": balance,
        "new_queries": new_queries,
        "new_challenges": new_challenges,
        "total_active": queries.get("total", 0),
        "total_judging": judging.get("total", 0)
    }

def mark_answered(qid):
    answered_queries.add(qid)

def mark_judged(cid):
    judged_challenges.add(cid)

if __name__ == "__main__":
    load_tokens()
    ensure_auth()
    # Pre-populate already answered
    answered_queries.update([
        "a44c94fc-8963-43ad-978c-33452843ffd3",
        "760d0831-8c29-4e84-a526-bfeca0294853",
        "c524bbba-0d8d-4d39-93c7-c2423af1433e"
    ])
    
    report = check_and_report()
    print(json.dumps(report, indent=2, default=str))
