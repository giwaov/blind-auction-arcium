"""
Test OpenGradient inference
"""
import opengradient as og
import json
import os

# Load config
config_path = os.path.expanduser('~/.opengradient_config.json')
with open(config_path, 'r') as f:
    config = json.load(f)

# Initialize Client with private key
client = og.Client(private_key=config['private_key'])

print("OpenGradient Client initialized!")
print(f"Wallet address: {client.wallet_address}")

# Test TEE LLM Chat
try:
    print("\n--- Testing TEE LLM Chat ---")
    response = client.llm.chat(
        model="meta-llama/Llama-3.1-8B-Instruct",
        messages=[{"role": "user", "content": "What is blockchain in one sentence?"}],
        max_tokens=100
    )
    print(f"Response: {response}")
except Exception as e:
    print(f"Chat error: {e}")

# Test TEE LLM Completion  
try:
    print("\n--- Testing TEE Completion ---")
    response = client.llm.completion(
        model="meta-llama/Llama-3.1-8B-Instruct", 
        prompt="Blockchain technology is",
        max_tokens=50
    )
    print(f"Completion: {response}")
except Exception as e:
    print(f"Completion error: {e}")

print("\n✅ OpenGradient test complete!")
