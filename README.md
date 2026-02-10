# 🦀 CrabDAO Agent

An autonomous AI agent that builds and transacts on Base blockchain, posting updates to Farcaster.

<p align="center">
  <img src="https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=ethereum&logoColor=white" alt="Base"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI"/>
</p>

## 🌟 Features

- **🔵 Base Blockchain Integration**: Deploy ERC20 tokens and NFT collections on Base
- **🤖 AI-Powered Decisions**: Uses GPT-4 to autonomously decide actions
- **📣 Farcaster Social**: Posts updates and engages with the community
- **⚡ Fully Autonomous**: No human intervention required
- **📊 State Persistence**: Tracks all deployments and transactions
- **🔒 Safety Limits**: Configurable daily transaction limits

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- A funded wallet on Base (mainnet or testnet)
- OpenAI API key
- Neynar API key (for Farcaster)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/crabdao-agent.git
cd crabdao-agent

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
```

### Configuration

Edit `.env` with your credentials:

```env
# Required
PRIVATE_KEY=your_wallet_private_key
OPENAI_API_KEY=your_openai_api_key
NEYNAR_API_KEY=your_neynar_api_key
FARCASTER_SIGNER_UUID=your_signer_uuid
FARCASTER_FID=your_fid

# Optional
USE_TESTNET=false
ACTION_INTERVAL_MINUTES=30
MAX_ETH_PER_TX=0.001
MAX_TX_PER_DAY=10
```

### Getting API Keys

1. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

2. **Neynar API Key**: 
   - Sign up at [Neynar](https://neynar.com)
   - Create a new app to get your API key
   - Create a managed signer to get your Signer UUID

3. **Farcaster FID**:
   - Your Farcaster user ID (visible in your profile URL or Warpcast settings)

### Running the Agent

```bash
# Check configuration
npm run dev

# Start the autonomous agent
npm run agent

# Run a single cycle (for testing)
npm run agent -- --once

# Deploy a token manually
npm run deploy-token

# Deploy with custom name
npx tsx src/scripts/deploy-token.ts "My Token" "MTK"
```

## 🏗️ Architecture

```
src/
├── agent.ts          # Main autonomous agent loop
├── config.ts         # Configuration management
├── index.ts          # Entry point / config checker
├── ai/
│   └── brain.ts      # AI decision engine (OpenAI)
├── blockchain/
│   ├── client.ts     # Viem wallet/public clients
│   ├── contracts.ts  # Contract ABIs and bytecode
│   └── deployer.ts   # Token/NFT deployment functions
├── social/
│   └── farcaster.ts  # Farcaster API integration
├── state/
│   └── manager.ts    # State persistence
├── scripts/
│   ├── deploy-token.ts
│   └── deploy-nft.ts
└── utils/
    └── logger.ts     # Winston logger
```

## 🤖 How It Works

1. **Initialization**: Agent loads state and connects to Base blockchain
2. **Context Gathering**: Fetches wallet balance, trending casts, mentions
3. **AI Decision**: GPT-4 analyzes context and decides next action
4. **Execution**: Performs the action (deploy token, post, engage, etc.)
5. **Social Update**: Posts about onchain activities to Farcaster
6. **Repeat**: Waits for configured interval and runs again

### Available Actions

| Action | Description |
|--------|-------------|
| `DEPLOY_TOKEN` | Deploy a new ERC20 token on Base |
| `DEPLOY_NFT` | Deploy a new NFT collection |
| `POST_UPDATE` | Post a status update to Farcaster |
| `ENGAGE_COMMUNITY` | Like, reply, or follow on Farcaster |
| `SEND_ETH` | Send ETH to an address (conservative) |
| `IDLE` | Take no action this cycle |

## 🔒 Safety Features

- **Daily Transaction Limits**: Configurable max transactions per day
- **ETH Spending Cap**: Maximum ETH per transaction
- **Testnet Mode**: Test on Base Sepolia before mainnet
- **State Persistence**: All actions are logged and recoverable

## 📊 Monitoring

The agent logs all activities to:
- Console output (colorized)
- `agent.log` (all logs)
- `agent-error.log` (errors only)

State is persisted to `agent-state.json` including:
- Deployed tokens and NFTs
- Transaction history
- Cast history
- Statistics

## 🌐 Deployed Contracts

When running on mainnet, view your deployed contracts:
- Tokens: Check BaseScan at the logged addresses
- NFTs: Check OpenSea on Base

## 🛠️ Development

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

## 📝 Example Output

```
🦀 CrabDAO Agent is now online and building on @base!

Wallet: https://basescan.org/address/0x...

✅ Deployed token $CRAB at 0x...
📢 Posted to Farcaster: Just deployed $CRAB on @base! 🦀🔵

💤 Waiting 30 minutes until next cycle...
```

## ⚠️ Disclaimer

This is an experimental autonomous agent. Use at your own risk:
- Only fund the agent wallet with what you're willing to lose
- Start with testnet to verify everything works
- Monitor the agent regularly
- The AI may make unexpected decisions

## 🦀 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🔗 Links

- [Base](https://base.org)
- [Farcaster](https://farcaster.xyz)
- [Neynar](https://neynar.com)
- [OpenAI](https://openai.com)

---

Built with 🦀 for the OpenClaw Builder Quest on Base 🔵
