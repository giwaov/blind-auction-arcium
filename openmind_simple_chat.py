"""
OpenMind Simple Chat - Runs in current terminal
Single-turn Q&A with the OpenMind API
"""

import requests

API_KEY = "om1_live_d081e18e2fc5e80c25b16e8605738dfed5fc05bdd26e4ae7"
MODEL = "gpt-4o-mini"
ENDPOINT = "https://api.openmind.org/api/core/openai/chat/completions"

def chat(message):
    """Send a message and print the response."""
    response = requests.post(
        ENDPOINT,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": MODEL,
            "messages": [{"role": "user", "content": message}],
            "max_tokens": 1024,
            "temperature": 0.7
        },
        timeout=120
    )
    
    if response.status_code == 200:
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens", "?")
        print(f"\n🤖 AI: {reply}")
        print(f"\n[{tokens} tokens]")
    else:
        print(f"\n❌ Error {response.status_code}: {response.text[:200]}")

print("=" * 50)
print("  OpenMind Chat - Type your message below")
print("  Type 'quit' to exit")
print("=" * 50)

while True:
    try:
        msg = input("\n🧑 You: ").strip()
        if not msg:
            continue
        if msg.lower() in ['quit', 'exit', 'q']:
            print("\n👋 Bye!")
            break
        chat(msg)
    except KeyboardInterrupt:
        print("\n👋 Bye!")
        break
