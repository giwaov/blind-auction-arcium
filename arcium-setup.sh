#!/bin/bash
# Arcium Development Environment Setup Script
# Run this in WSL Ubuntu

set -e
echo "=== Arcium Blind Auction Dev Setup ==="

# 1. Install system dependencies
echo "[1/6] Installing system dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl build-essential pkg-config libssl-dev libudev-dev git

# 2. Install Rust
echo "[2/6] Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustc --version

# 3. Install Solana CLI (v2.3.0)
echo "[3/6] Installing Solana CLI..."
sh -c "$(curl -sSfL https://release.solana.com/v2.3.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
solana --version

# Generate keypair if not exists
if [ ! -f ~/.config/solana/id.json ]; then
    solana-keygen new --no-bip39-passphrase
fi

# 4. Install Node.js and Yarn
echo "[4/6] Installing Node.js and Yarn..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g yarn
yarn --version

# 5. Install Anchor
echo "[5/6] Installing Anchor..."
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1
anchor --version

# 6. Install Arcium
echo "[6/6] Installing Arcium..."
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
source ~/.bashrc
arcium --version

echo ""
echo "=== Setup Complete! ==="
echo "Run: cd ~/blind-auction && arcium init blind-auction"
