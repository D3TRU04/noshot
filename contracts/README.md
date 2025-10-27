# NoShot Smart Contracts

Solana smart contracts for peer-to-peer betting using Anchor framework.

## Overview

The NoShot program allows users to create betting groups, join them, place bets on yes/no outcomes, and claim winnings. All bets are settled on-chain with transparent outcomes.

## Program Functions

### 1. `create_group`
Creates a new betting group.

**Parameters:**
- `code`: Unique group identifier (String)
- `max_members`: Maximum members allowed (Option<u8>)
- `bet_duration_hours`: How long betting is open (u64)
- `bet_amount`: Default bet amount in USDC (u64)
- `bet_description`: Description of the bet (String)

### 2. `join_group`
Allows a user to join a betting group.

**Validation:**
- Group must be open for betting
- Member limit must not be exceeded (if set)

### 3. `place_bet`
Places a bet on one side (Yes or No).

**Parameters:**
- `side`: BetSide enum (Yes or No)
- `amount`: Amount to bet in USDC (u64)

**Validation:**
- Group must be open for betting
- Betting period must not have expired
- User must be a member of the group

### 4. `resolve_bet`
Resolves the bet and declares the winning side. Only the group creator can call this.

**Parameters:**
- `winning_side`: The side that won (BetSide)

**Validation:**
- Caller must be the group creator

### 5. `claim_winnings`
Allows winners to claim their winnings after a bet is resolved.

**Validation:**
- Bet must be resolved
- Member must have bet on the winning side

## Data Structures

### Group
- `creator`: Pubkey of the group creator
- `code`: Unique group code
- `max_members`: Optional member limit
- `bet_duration_hours`: Duration of betting period
- `bet_amount`: Default bet amount
- `bet_description`: Bet description
- `bets_open`: Whether betting is currently open
- `winning_side`: The winning side (if resolved)
- `created_at`: Creation timestamp
- `resolved_at`: Resolution timestamp (if resolved)
- `member_count`: Current number of members

### Member
- `wallet`: Member's wallet address
- `group`: Associated group address
- `bet_side`: Side they bet on (Yes or No)
- `amount_bet`: Amount they bet

### BetSide Enum
- `Yes`: Betting on the yes outcome
- `No`: Betting on the no outcome

## Error Codes

- `BettingClosed`: Attempted to bet but betting is closed
- `GroupFull`: Group has reached member limit
- `BettingExpired`: Betting period has expired
- `Unauthorized`: Caller doesn't have permission
- `InvalidMember`: Member doesn't belong to the group
- `NotResolved`: Bet hasn't been resolved yet
- `LostBet`: User bet on the losing side

## Build & Deploy

```bash
# Build the program
anchor build

# Deploy to local validator
anchor deploy

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## Development

```bash
# Run tests
anchor test

# Start local validator
solana-test-validator

# Check logs
solana logs
```

## Security Notes

- All account updates use Anchor's built-in security checks
- PDA (Program Derived Addresses) are used for deterministic account derivation
- Time-based validation ensures bets can only be placed during the betting window
- Only group creators can resolve bets
- Winners are verified before allowing claims

