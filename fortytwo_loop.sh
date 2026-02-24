#!/bin/bash
# Fortytwo monitoring loop - checks every 60s, outputs status
BASE="https://app.fortytwo.network/api"
AGENT="04bc0c37-3ced-427a-bd57-42fb080185a1"
SECRET="J-1KD5krK4vng6KhBJxbR090l9G38GhVMDO6XvS65vM"
TOKEN_FILE="C:/Users/DELL/Desktop/crabdao-agent/fortytwo_tokens.json"
ACTION_FILE="C:/Users/DELL/Desktop/crabdao-agent/fortytwo_actions.json"

get_token() {
    python -c "
import json
with open('$TOKEN_FILE', encoding='utf-8') as f:
    print(json.load(f)['tokens']['access_token'])
"
}

refresh() {
    python -c "
import json, urllib.request
with open('$TOKEN_FILE', encoding='utf-8') as f:
    rt = json.load(f)['tokens']['refresh_token']
payload = json.dumps({'refresh_token': rt}).encode()
req = urllib.request.Request('$BASE/auth/refresh', data=payload, headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())
        with open('$TOKEN_FILE','w') as f: json.dump(data, f, indent=2)
        print(data['tokens']['access_token'])
except:
    # Re-login
    payload = json.dumps({'agent_id':'$AGENT','secret':'$SECRET'}).encode()
    req = urllib.request.Request('$BASE/auth/login', data=payload, headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())
        with open('$TOKEN_FILE','w') as f: json.dump(data, f, indent=2)
        print(data['tokens']['access_token'])
"
}

CYCLE=0
while true; do
    CYCLE=$((CYCLE + 1))
    
    # Refresh token every 10 cycles (10 min)
    if [ $((CYCLE % 10)) -eq 1 ]; then
        TOKEN=$(refresh)
    else
        TOKEN=$(get_token)
    fi
    
    echo "--- Cycle $CYCLE $(date -u +%H:%M:%S) ---"
    
    # Check active queries
    QUERIES=$(curl -s "$BASE/queries/active?page=1&page_size=20" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    QCOUNT=$(echo "$QUERIES" | python -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null)
    echo "Active queries: $QCOUNT"
    
    # Check pending judging
    JUDGING=$(curl -s "$BASE/rankings/pending/$AGENT?page=1&page_size=20" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    JCOUNT=$(echo "$JUDGING" | python -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null)
    echo "Pending judging: $JCOUNT"
    
    # Write action file for parent to pick up
    python -c "
import json, sys
queries = json.loads('''$QUERIES''')
judging = json.loads('''$JUDGING''')
actions = {'cycle': $CYCLE, 'queries': queries, 'judging': judging, 'token': '$TOKEN'}
with open('$ACTION_FILE', 'w') as f:
    json.dump(actions, f, indent=2)
    
# Show new items
for q in queries.get('queries', []):
    print(f'  Q: {q[\"id\"][:8]}... {q[\"specialization\"]} ({q[\"answer_count\"]} answers)')
for c in judging.get('challenges', []):
    if not c.get('has_voted'):
        print(f'  J: {c[\"id\"][:8]}... {c[\"query_specialization\"]} deadline={c[\"effective_voting_deadline\"][11:19]}')
" 2>/dev/null
    
    echo ""
    sleep 60
done
