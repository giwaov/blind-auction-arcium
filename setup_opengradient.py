from eth_account import Account
import json
import os

# Generate a new account
acct = Account.create()
private_key = acct.key.hex()
address = acct.address

# Create config
config = {
    'private_key': private_key,
    'alpha_private_key': private_key,
    'email': '',
    'password': ''
}

config_path = os.path.expanduser('~/.opengradient_config.json')
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print(f'Wallet Address: {address}')
print(f'Config saved to: {config_path}')
print(f'\n⚠️  Fund this wallet at: https://faucet.opengradient.ai/?address={address}')
