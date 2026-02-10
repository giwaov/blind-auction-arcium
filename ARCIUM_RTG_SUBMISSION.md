# Blind Auction on Arcium -- RTG Submission

**Builder:** giwaov
**Program ID:** `EGePzFcrUy9d9uxQk7eutiAjUK1kbXHs8FydhMTZWJXX`
**Network:** Solana Devnet
**Live Demo:** [blind-auction-frontend.vercel.app](https://blind-auction-frontend.vercel.app)
**Source Code:** [github.com/giwaov/blind-auction-arcium](https://github.com/giwaov/blind-auction-arcium)

---

## Executive Summary

Blind Auction is a fully functional sealed-bid auction system built on Solana that uses Arcium's MPC network to keep all bid amounts encrypted. Bidders submit encrypted bids that are compared inside Arcium's Multi-party eXecution Environment (MXE) -- no single party, node, or validator ever sees the plaintext bid amounts. Only the winning bid is revealed when the auction closes.

This project demonstrates a real-world use case where Arcium's confidential computing directly solves problems that are impossible to address with standard onchain transparency.

---

## Problem Statement

Onchain auctions today are fundamentally broken because blockchains are transparent by design. When you place a bid on any existing Solana or Ethereum auction:

1. **Everyone sees your bid amount** -- including competitors, bots, and MEV extractors
2. **Front-runners outbid you** -- automated bots watch the mempool and submit bids $0.01 higher
3. **Bid snipers wait until the last second** -- they see the current highest bid and snipe it
4. **Bidders collude** -- visible bid history enables coordinated manipulation
5. **Market intent is leaked** -- revealing how much you're willing to pay for an asset has cascading effects

These aren't theoretical problems. They cost users millions of dollars across DeFi, NFTs, and token auctions every day. The root cause is simple: **auction bids should be private, but blockchains are public.**

---

## Solution: Arcium MPC for Encrypted Auctions

Arcium's MPC network lets us build auctions where:

| Traditional Auction | Blind Auction (Arcium) |
|--------------------|-----------------------|
| All bids visible onchain | All bids encrypted end-to-end |
| Front-running is trivial | Impossible -- bids are ciphertexts |
| Highest bid visible in real-time | Encrypted until auction closes |
| Bidder strategy exposed | Only bidder knows their own bid |
| Requires trusted auctioneer | Trustless -- MPC nodes verify each other |

The key insight: **Arcium lets us compute comparisons on encrypted data.** We can determine which bid is highest without ever decrypting the individual bids. This is exactly what auction integrity requires.

---

## Technical Implementation

### Layer 1: ARCIS Circuits (MPC Logic)

The encrypted computation logic is written in ARCIS and runs inside Arcium's MXE:

**Encrypted data types used:**
- `Enc<Mxe, AuctionState>` -- Auction state encrypted with the MXE cluster key. No single node can decrypt.
- `Enc<Shared, EncryptedBid>` -- Bid data encrypted between the bidder and MPC nodes.

**Three core circuits:**

#### `init_auction`
Initializes encrypted zero state for a new auction:
```rust
#[instruction]
pub fn init_auction(
    _input: Enc<Shared, u8>,
) -> Enc<Mxe, AuctionState> {
    let initial_state = AuctionState {
        highest_bid: 0,
        highest_bidder: 0,
        bid_count: 0,
        is_open: 1,
    };
    Enc::<Mxe, AuctionState>::from_arcis(initial_state)
}
```

#### `place_bid`
Compares an encrypted bid against the encrypted current highest. The bidder only learns whether they're winning -- not the actual highest bid:
```rust
#[instruction]
pub fn place_bid(
    current_state: Enc<Mxe, AuctionState>,
    new_bid: Enc<Shared, EncryptedBid>,
) -> (Enc<Mxe, AuctionState>, Enc<Shared, BidResult>) {
    let state = current_state.to_arcis();
    let bid = new_bid.to_arcis();

    let is_higher = bid.amount > state.highest_bid;

    // Update state if this bid wins (all encrypted)
    let updated_state = AuctionState {
        highest_bid: if is_higher { bid.amount } else { state.highest_bid },
        highest_bidder: if is_higher { bid.bidder_id } else { state.highest_bidder },
        bid_count: state.bid_count + 1,
        is_open: state.is_open,
    };

    // Bidder only gets: "are you winning? yes/no"
    let result = BidResult {
        is_winning: if is_higher { 1 } else { 0 },
        total_bids: state.bid_count + 1,
    };

    (
        Enc::<Mxe, AuctionState>::from_arcis(updated_state),
        new_bid.owner.from_arcis(result)
    )
}
```

#### `close_auction`
Reveals only the winner and winning amount. All other bids remain permanently encrypted:
```rust
#[instruction]
pub fn close_auction(
    current_state: Enc<Mxe, AuctionState>,
    _reveal_key: Enc<Shared, u8>,
) -> Enc<Shared, AuctionResult> {
    let state = current_state.to_arcis();
    let result = AuctionResult {
        winner_id: state.highest_bidder,
        winning_amount: state.highest_bid,
        total_bids: state.bid_count,
    };
    _reveal_key.owner.from_arcis(result)
}
```

#### Vickrey Variant (Bonus)
Also implemented: `place_vickrey_bid` and `close_vickrey_auction` for second-price auctions, tracking both first and second highest bids in encrypted space via a `VickreyState` struct.

---

### Layer 2: Solana Program (On-Chain Orchestration)

The Anchor program (`EGePzFcrUy9d9uxQk7eutiAjUK1kbXHs8FydhMTZWJXX`) manages auction lifecycle and bridges to Arcium's MPC network.

**Account structure:**
```
Auction PDA (90 bytes) -- seeds: ["auction", auction_id]
 - auction_id:    [u8; 32]   -- Unique auction identifier
 - authority:     Pubkey      -- Auction creator
 - end_time:      i64         -- Unix timestamp
 - min_bid:       u64         -- Minimum bid in lamports
 - is_finalized:  bool        -- Whether auction has closed
 - bump:          u8          -- PDA bump seed
```

**Arcium integration points:**

1. **`queue_computation()`** -- Dispatches encrypted data to MPC nodes
2. **`#[arcium_callback]`** -- Receives verified computation results
3. **`ArgBuilder`** -- Constructs encrypted arguments:
   - `.x25519_pubkey(pubkey)` -- Bidder's encryption key
   - `.plaintext_u128(nonce)` -- Computation nonce
   - `.encrypted_u64(ciphertext)` -- Encrypted bid fields
4. **`SignedComputationOutputs<T>`** -- Typed, verified MPC output in callbacks
5. **Arcium account derives** -- `derive_mxe_pda!()`, `derive_comp_pda!()`, `derive_cluster_pda!()`, etc.

**Computation definition initialization:**
Three comp defs registered via `#[init_computation_definition_accounts]`:
- `init_auction` (offset via `comp_def_offset("init_auction")`)
- `place_bid` (offset via `comp_def_offset("place_bid")`)
- `close_auction` (offset via `comp_def_offset("close_auction")`)

**Security checks in the program:**
- Time-based auction open/close enforcement (`Clock::get()`)
- Authority verification for `close_auction`
- Double-close prevention (`is_finalized` guard)
- MPC output verification in every callback (`output.verify_output()`)

---

### Layer 3: Frontend (User-Facing)

**Stack:** Next.js 14, TypeScript, Solana Wallet Adapter, Tailwind CSS

**Key features:**
- Wallet-standard auto-detection (Phantom, Solflare, etc.)
- Real-time auction browsing via `getProgramAccounts` with discriminator filtering
- Account data parsing matching the 90-byte Auction struct layout
- Glassmorphism UI with Arcium-inspired purple/cyan gradients
- Mobile-responsive design
- Deployed on Vercel: [blind-auction-frontend.vercel.app](https://blind-auction-frontend.vercel.app)

---

## Arcium Features Used

| Feature | How It's Used |
|---------|--------------|
| **MXE (Multi-party eXecution Environment)** | Hosts encrypted auction state; cluster 456 on devnet |
| **ARCIS** | Encrypted instruction language for bid comparison circuits |
| **`Enc<Mxe, T>`** | Auction state encrypted with cluster key -- no single party decrypts |
| **`Enc<Shared, T>`** | Bid data shared between bidder and MPC for computation |
| **`queue_computation()`** | Dispatches encrypted bid data to MPC nodes |
| **`#[arcium_callback]`** | Receives and verifies MPC results on-chain |
| **`ArgBuilder`** | Constructs encrypted arguments (x25519 pubkeys, nonces, ciphertexts) |
| **`comp_def_offset()`** | Registers computation definitions for each circuit |
| **`SignedComputationOutputs`** | Typed verification of MPC outputs against cluster |
| **`ArciumSignerAccount`** | Sign PDA for Arcium callback verification |
| **Cluster Management** | MXE init, keygen, circuit upload on devnet cluster |

---

## Deployment Artifacts

| Artifact | Status | Reference |
|----------|--------|-----------|
| Solana Program | Deployed to devnet | `EGePzFcrUy9d9uxQk7eutiAjUK1kbXHs8FydhMTZWJXX` |
| Wallet | Funded | `Fx4GzFMkJx8mTmEXTyamQH6v85e6GbzbcuaQqKGxrjUc` |
| MXE Cluster | Initialized | Cluster ID 456, keygen in progress |
| ARCIS Circuits | Built | `init_auction.arcis`, `place_bid.arcis`, `close_auction.arcis` |
| Frontend | Live | [blind-auction-frontend.vercel.app](https://blind-auction-frontend.vercel.app) |
| Source Code | Public | [github.com/giwaov/blind-auction-arcium](https://github.com/giwaov/blind-auction-arcium) |

---

## Real-World Applications

This pattern directly applies to:

1. **NFT Auctions** -- Fair price discovery without sniping or front-running
2. **Token Sales / IDOs** -- Private bidding for allocations prevents whale manipulation
3. **Government Procurement** -- Sealed-bid contracting with cryptographic guarantees
4. **Domain Auctions** -- ENS/SNS name sales without bidding wars based on visible amounts
5. **Real Estate** -- Property sales where offer amounts remain confidential
6. **Ad Auctions** -- Vickrey (second-price) auctions for ad placement, similar to Google Ads

---

## Roadmap

- **Mainnet deployment** -- Deploy program and MXE to Solana mainnet
- **Vickrey mode activation** -- Enable second-price auction circuits (already implemented)
- **Multi-item auctions** -- Batch auctions for multiple items with combinatorial bidding
- **Auction marketplace** -- Platform for anyone to create and manage encrypted auctions
- **SDK / npm package** -- Developer toolkit for integrating blind auctions into other dApps
- **Cross-chain support** -- Extend to other chains via Arcium's cross-chain MPC

---

## Summary

Blind Auction on Arcium demonstrates that **practical, user-facing privacy applications can be built on Solana today** using Arcium's MPC network. The project covers the full stack -- from ARCIS circuit design, to on-chain program integration with `queue_computation` and callbacks, to a polished frontend with wallet connectivity.

The core innovation is simple but powerful: auctions where bids are compared without being revealed. Arcium makes this possible with minimal developer friction -- the same Rust skills that build Solana programs extend naturally to ARCIS encrypted instructions.

---

**Built for the Arcium RTG Program by giwaov.**
