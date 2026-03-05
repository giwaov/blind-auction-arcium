"""
OpenMind Interactive Chat Agent
Have a conversation with AI using the OpenMind API.

Usage:
  Run: python openmind_chat.py
  Run: python openmind_chat.py --auto   (auto-reply mode)
  Type your message and press Enter
  Type 'quit', 'exit', or 'bye' to stop
  Type 'clear' to reset conversation history
  Type 'help' for commands
"""

import requests
import time
import sys
from datetime import datetime

# Fix Windows encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ════════════════════════════════════════════════════════════════
#                      CONFIGURATION
# ════════════════════════════════════════════════════════════════

API_KEY = "om1_live_d081e18e2fc5e80c25b16e8605738dfed5fc05bdd26e4ae7"

# Model settings
MODEL = "gpt-4o"  # Using most expensive model for max token burn
BASE_URL = "https://api.openmind.org/api/core/openai"
ENDPOINT = f"{BASE_URL}/chat/completions"

# Chat settings
MAX_TOKENS = 4096  # Max tokens per response
TEMPERATURE = 0.9  # Higher creativity = longer responses
SYSTEM_PROMPT = """You are an extremely verbose AI assistant who loves to explain everything in great detail. 
Always provide comprehensive, lengthy explanations with multiple examples, analogies, and thorough analysis.
Never give short answers. Always elaborate extensively on every topic."""

# Auto-reply settings
AUTO_REPLY_DELAY = 0  # No delay - maximum speed!
AUTO_REPLY_MAX_TURNS = 10000  # Basically unlimited
AUTO_REPLY_MAX_HISTORY = 30  # Lower history = more restarts = more initial tokens
AUTO_REPLY_TOPICS = [
    "What's an interesting topic you'd like to explore today?",
    "Tell me something fascinating about technology.",
    "What are some emerging trends in AI?",
    "Explain a complex concept in simple terms.",
    "What's a thought-provoking question you can answer?",
]


# ════════════════════════════════════════════════════════════════
#                      CHAT AGENT CLASS
# ════════════════════════════════════════════════════════════════

class OpenMindChat:
    def __init__(self):
        self.conversation_history = []
        self.total_tokens = 0
        self.message_count = 0
        
        # Add system prompt
        self.conversation_history.append({
            "role": "system",
            "content": SYSTEM_PROMPT
        })
    
    def trim_history(self, max_messages=AUTO_REPLY_MAX_HISTORY):
        """Trim old messages to prevent context overflow."""
        if len(self.conversation_history) > max_messages:
            # Keep system prompt + last N messages
            system_prompt = self.conversation_history[0]
            self.conversation_history = [system_prompt] + self.conversation_history[-(max_messages-1):]
            print(f"\n🔄 Trimmed history to {len(self.conversation_history)} messages\n")
    
    def send_message(self, user_message):
        """Send a message and get a response."""
        # Trim history before sending
        self.trim_history()
        
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": MODEL,
            "messages": self.conversation_history,
            "max_tokens": MAX_TOKENS,
            "temperature": TEMPERATURE
        }
        
        try:
            response = requests.post(ENDPOINT, headers=headers, json=payload, timeout=120)
            
            if response.status_code == 200:
                data = response.json()
                assistant_message = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                
                # Add assistant response to history
                self.conversation_history.append({
                    "role": "assistant",
                    "content": assistant_message
                })
                
                self.total_tokens += usage.get("total_tokens", 0)
                self.message_count += 1
                
                return {
                    "success": True,
                    "message": assistant_message,
                    "tokens": usage.get("total_tokens", 0)
                }
            elif response.status_code == 400 and "context length" in response.text:
                # Context too long - clear history and retry
                print("\n⚠️ Context too long - clearing history and starting fresh...")
                self.conversation_history.pop()  # Remove failed user message
                self.clear_history()
                return {
                    "success": False,
                    "error": "Context trimmed - will retry with fresh history"
                }
            else:
                # Remove the failed user message from history
                self.conversation_history.pop()
                return {
                    "success": False,
                    "error": f"API Error {response.status_code}: {response.text[:200]}"
                }
                
        except Exception as e:
            # Remove the failed user message from history
            self.conversation_history.pop()
            return {
                "success": False,
                "error": f"Request failed: {str(e)}"
            }
    
    def clear_history(self):
        """Clear conversation history but keep system prompt."""
        self.conversation_history = [{
            "role": "system",
            "content": SYSTEM_PROMPT
        }]
        self.message_count = 0
        print("\n🗑️  Conversation cleared. Starting fresh!\n")
    
    def show_stats(self):
        """Show conversation statistics."""
        print(f"\n📊 Stats:")
        print(f"   Messages: {self.message_count}")
        print(f"   Total tokens used: {self.total_tokens}")
        print(f"   History length: {len(self.conversation_history)} messages\n")
    
    def show_help(self):
        """Show available commands."""
        print("""
╔════════════════════════════════════════════════════════════╗
║                      COMMANDS                              ║
╠════════════════════════════════════════════════════════════╣
║  quit, exit, bye  │  Exit the chat                         ║
║  clear            │  Clear conversation history            ║
║  stats            │  Show usage statistics                 ║
║  help             │  Show this help message                ║
║  model            │  Show current model                    ║
║  auto             │  Toggle auto-reply mode                ║
╚════════════════════════════════════════════════════════════╝
""")

    def generate_followup(self):
        """Generate a follow-up question based on the last response."""
        # Trim history before generating
        self.trim_history()
        
        followup_prompt = {
            "role": "user",
            "content": "Based on what you just said, ask yourself an interesting follow-up question that explores the topic deeper or moves to a related interesting topic. Then answer that question thoroughly. Format: Start with 'QUESTION: [your question]' then provide the answer."
        }
        
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        messages = self.conversation_history + [followup_prompt]
        
        payload = {
            "model": MODEL,
            "messages": messages,
            "max_tokens": MAX_TOKENS,
            "temperature": TEMPERATURE + 0.1  # Slightly more creative for follow-ups
        }
        
        try:
            response = requests.post(ENDPOINT, headers=headers, json=payload, timeout=120)
            
            if response.status_code == 200:
                data = response.json()
                followup_response = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                
                # Add the follow-up exchange to history
                self.conversation_history.append(followup_prompt)
                self.conversation_history.append({
                    "role": "assistant",
                    "content": followup_response
                })
                
                self.total_tokens += usage.get("total_tokens", 0)
                self.message_count += 1
                
                return {
                    "success": True,
                    "message": followup_response,
                    "tokens": usage.get("total_tokens", 0)
                }
            elif response.status_code == 400 and "context length" in response.text:
                # Context too long - clear history and signal restart
                print("\n⚠️ Context too long - clearing history and starting fresh topic...")
                self.clear_history()
                return {
                    "success": False,
                    "error": "RESTART",
                    "restart": True
                }
            else:
                return {
                    "success": False,
                    "error": f"API Error {response.status_code}: {response.text[:200]}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Request failed: {str(e)}"
            }


# ════════════════════════════════════════════════════════════════
#                      AUTO-REPLY MODE
# ════════════════════════════════════════════════════════════════

def run_auto_reply(initial_topic=None):
    """Run the chat in auto-reply mode."""
    import random
    
    print("""
╔════════════════════════════════════════════════════════════╗
║       🤖 OpenMind AUTO-REPLY Mode Active 🤖                ║
╠════════════════════════════════════════════════════════════╣
║  The AI will have a conversation with itself               ║
║  Press Ctrl+C to stop at any time                          ║
╚════════════════════════════════════════════════════════════╝
""")
    print(f"  Model: {MODEL}")
    print(f"  Delay between messages: {AUTO_REPLY_DELAY}s")
    print(f"  Max turns: {AUTO_REPLY_MAX_TURNS}\n")
    print("─" * 60)
    
    chat = OpenMindChat()
    turn = 0
    
    # Start with initial topic or random one
    if initial_topic:
        first_message = initial_topic
    else:
        first_message = random.choice(AUTO_REPLY_TOPICS)
    
    print(f"\n🚀 Starting topic: {first_message}\n")
    print("─" * 60)
    
    try:
        # Send initial message
        print("\n🤖 Assistant: ", end="", flush=True)
        result = chat.send_message(first_message)
        
        if result["success"]:
            print(result["message"])
            print(f"\n   💬 [Turn {turn + 1} | {result['tokens']} tokens]")
        else:
            print(f"\n❌ {result['error']}")
            return
        
        print("─" * 60)
        turn += 1
        
        # Auto-reply loop
        while turn < AUTO_REPLY_MAX_TURNS:
            print(f"\n⏳ Generating follow-up in {AUTO_REPLY_DELAY}s... (Ctrl+C to stop)")
            time.sleep(AUTO_REPLY_DELAY)
            
            print("\n🔄 Auto-generating follow-up...\n")
            print("─" * 60)
            print("\n🤖 Assistant: ", end="", flush=True)
            
            result = chat.generate_followup()
            
            if result["success"]:
                print(result["message"])
                print(f"\n   💬 [Turn {turn + 1} | {result['tokens']} tokens | Total: {chat.total_tokens}]")
            elif result.get("restart"):
                # Context was too long - start fresh with new topic
                print("\n🔁 Starting fresh with new topic...")
                new_topic = random.choice(AUTO_REPLY_TOPICS)
                print(f"\n🚀 New topic: {new_topic}\n")
                print("─" * 60)
                print("\n🤖 Assistant: ", end="", flush=True)
                result = chat.send_message(new_topic)
                if result["success"]:
                    print(result["message"])
                    print(f"\n   💬 [Turn {turn + 1} | {result['tokens']} tokens | Total: {chat.total_tokens}]")
                else:
                    print(f"\n❌ {result['error']}")
                    time.sleep(2)
                    continue
            else:
                print(f"\n❌ {result['error']}")
                print("Retrying in 5 seconds...")
                time.sleep(5)
                continue
            
            print("─" * 60)
            turn += 1
        
        print(f"\n✅ Reached max turns ({AUTO_REPLY_MAX_TURNS})")
        
    except KeyboardInterrupt:
        print("\n\n🛑 Auto-reply stopped by user.\n")
    
    chat.show_stats()


# ════════════════════════════════════════════════════════════════
#                      MAIN CHAT LOOP
# ════════════════════════════════════════════════════════════════

def main():
    # Check for auto mode from command line
    if len(sys.argv) > 1:
        if sys.argv[1] in ['--auto', '-a', 'auto']:
            topic = ' '.join(sys.argv[2:]) if len(sys.argv) > 2 else None
            run_auto_reply(topic)
            return
    
    print("""
╔════════════════════════════════════════════════════════════╗
║          🤖 OpenMind Interactive Chat Agent 🤖             ║
╠════════════════════════════════════════════════════════════╣
║  Type your message and press Enter to chat                 ║
║  Type 'help' for commands, 'quit' to exit                  ║
║  Type 'auto' to start auto-reply mode                      ║
╚════════════════════════════════════════════════════════════╝
""")
    print(f"  Model: {MODEL}")
    print(f"  Ready to chat!\n")
    print("─" * 60)
    
    chat = OpenMindChat()
    
    while True:
        try:
            # Get user input
            user_input = input("\n🧑 You: ").strip()
            
            # Skip empty input
            if not user_input:
                continue
            
            # Handle commands
            cmd = user_input.lower()
            
            if cmd in ['quit', 'exit', 'bye', 'q']:
                print("\n👋 Goodbye! Thanks for chatting.\n")
                chat.show_stats()
                break
            
            elif cmd == 'clear':
                chat.clear_history()
                continue
            
            elif cmd == 'stats':
                chat.show_stats()
                continue
            
            elif cmd == 'help':
                chat.show_help()
                continue
            
            elif cmd == 'model':
                print(f"\n📦 Current model: {MODEL}\n")
                continue
            
            elif cmd == 'auto':
                print("\n🔄 Switching to auto-reply mode...\n")
                run_auto_reply()
                # After auto mode, create fresh chat
                chat = OpenMindChat()
                print("\n📝 Back to interactive mode.\n")
                continue
            
            # Send message to API
            print("\n🤖 Assistant: ", end="", flush=True)
            
            result = chat.send_message(user_input)
            
            if result["success"]:
                print(result["message"])
                print(f"\n   💬 [{result['tokens']} tokens]")
            else:
                print(f"\n❌ {result['error']}")
            
            print("─" * 60)
            
        except KeyboardInterrupt:
            print("\n\n👋 Chat interrupted. Goodbye!\n")
            chat.show_stats()
            break
        except EOFError:
            print("\n\n👋 Goodbye!\n")
            break


if __name__ == "__main__":
    main()
