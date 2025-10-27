# Automatic Disbursement System

## Overview

This document describes the automatic payout system for NoShot betting, inspired by Jokerrace.io. The system automatically distributes winnings when bets are resolved.

## How It Works

### 1. Creating a Betting Group
- When a group is created, a **betting vault** is initialized to hold all bet amounts
- The vault is a PDA (Program Derived Address) owned by the program
- It holds USDC (or any SPL token) deposits from all participants

### 2. Placing Bets
- When users place bets, their USDC is transferred to the vault
- The vault tracks total amounts bet on each side (Yes/No)
- Example:
  - Alice bets $10 on YES
  - Bob bets $10 on NO
  - Total pool: $20

### 3. Resolving the Bet
- Only the group creator can resolve the bet
- The winning side is declared (YES or NO)
- The vault calculates the total pool

### 4. Automatic Disbursement
When `claim_winnings` is called by a winner:

```
Total Pool = Sum of all bet amounts from both sides
Winner's Bet = Amount the winner bet on the winning side
Winner's Share = (Winner's Bet / Total Bets on Winning Side) * Total Pool

Payout = Winner's Share
```

### Example Calculation

**Scenario:**
- Alice: $50 on YES
- Bob: $20 on NO  
- Charlie: $30 on YES

**Total Pool:** $100

**If YES wins:**
- Total YES bets: $50 + $30 = $80
- Alice's share: ($50 / $80) × $100 = $62.50
- Charlie's share: ($30 / $80) × $100 = $37.50

**If NO wins:**
- Total NO bets: $20
- Bob's share: ($20 / $20) × $100 = $100.00

## Smart Contract Implementation

### Key Accounts

1. **Betting Vault** - PDA that holds all bet tokens
2. **User Token Accounts** - Individual user's USDC accounts
3. **Group Account** - Stores bet state and totals
4. **Member Accounts** - Track individual bets

### Functions

#### Enhanced `place_bet`
```rust
pub fn place_bet(ctx: Context<PlaceBet>, side: BetSide, amount: u64) -> Result<()> {
    // 1. Transfer USDC from user to vault
    // 2. Update group totals (yes_total, no_total)
    // 3. Update member's bet info
}
```

#### Enhanced `claim_winnings`
```rust
pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
    // 1. Verify user bet on winning side
    // 2. Calculate their proportional share
    // 3. Transfer USDC from vault to user
    // 4. Update vault balance
}
```

#### New `distribute_all_winnings`
```rust
pub fn distribute_all_winnings(ctx: Context<DistributeAll>) -> Result<()> {
    // Automatically distribute to ALL winners in one transaction
    // More gas efficient than individual claims
}
```

## Integration Points

### Frontend Integration
1. **Display Pool Size**: Show total pool to users
2. **Show Odds**: Calculate and display current odds
3. **Real-time Balance**: Display vault balance
4. **Claim Button**: One-click claim for winners

### Database Integration
- Store bet results in Supabase
- Track who has claimed vs pending
- Query outstanding payouts

## Advanced Features

### 1. Payout Splitting
If multiple winners, automatically split pool proportionally

### 2. Minimum Stake
Enforce minimum bet amount (e.g., $1 USDC)

### 3. Platform Fee (Optional)
Deduct small fee (e.g., 2-5%) for platform, rest to winners

### 4. Time-locked Payouts
Allow claims only after resolution + time window

### 5. Emergency Refunds
If bet unresolved for X time, refund all participants

## Security Considerations

1. **Reentrancy Protection**: Use check-effects-interactions pattern
2. **Round-off Errors**: Handle wei-level precision carefully
3. **Oracle Integration**: For automatic resolution based on events
4. **Access Control**: Only creators can resolve
5. **Rate Limiting**: Prevent spam claims

## Testing Strategy

1. **Unit Tests**: Individual function logic
2. **Integration Tests**: Full bet-to-payout flow
3. **Edge Cases**:
   - Only one side bet
   - No winners
   - Everyone bets same side
4. **Load Testing**: Multiple concurrent claims

## Implementation Status

- ✅ Basic betting logic
- ✅ Group creation
- ⚠️ Token transfers (needs SPL integration)
- ⚠️ Disbursement logic (needs calculation engine)
- ⚠️ Frontend integration
- ⚠️ Testing

