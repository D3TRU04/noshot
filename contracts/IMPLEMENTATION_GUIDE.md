# Implementation Guide: Automatic Disbursement System

## Quick Start

### 1. Replace Current Contract

```bash
cd contracts
mv programs/noshot/src/lib.rs programs/noshot/src/lib.rs.backup
mv programs/noshot/src/lib_with_disbursement.rs programs/noshot/src/lib.rs
```

### 2. Install SPL Token Dependencies

Add to `contracts/Cargo.toml`:
```toml
[dependencies]
anchor-spl = "0.29.0"
```

### 3. Build and Deploy

```bash
anchor build
anchor deploy --provider.cluster devnet
```

## Frontend Integration

### 1. Show Pool Size

Update game page to display:
```typescript
// Fetch vault balance
const vaultBalance = await getVaultBalance(groupId);
// Display: "Pool: ${vaultBalance} USDC"
```

### 2. Calculate Odds

```typescript
const odds = {
  yes: (group.total_yes / (group.total_yes + group.total_no)) * 100,
  no: (group.total_no / (group.total_yes + group.total_no)) * 100
};
```

### 3. Claim Winnings Button

```typescript
<button onClick={handleClaimWinnings}>
  Claim ${calculatedWinnings} USDC
</button>
```

### 4. Handle Payments

```typescript
async function handlePlaceBet(amount: number) {
  const tx = await program.methods
    .placeBet({ yes: {} }, amount)
    .accounts({
      vault: vaultPDA,
      userTokenAccount: userUSDCAccount,
      // ... other accounts
    })
    .rpc();
}
```

## Testing Checklist

- [ ] Create a group
- [ ] Place bets on both sides
- [ ] Verify vault balance increases
- [ ] Resolve the bet
- [ ] Winners can claim
- [ ] Losers cannot claim
- [ ] Payouts are correct

## Production Considerations

1. **Use USDC on Solana**: Deploy USDC mint or use existing
2. **Oracle Integration**: For automatic resolution
3. **Platform Fee**: Optional 2-5% fee
4. **Multi-sig**: For creator resolution safety
5. **Audit**: Smart contract audit before mainnet

## Security

- ✅ PDA vaults (only program can withdraw)
- ✅ Proportional distribution (no rounding attacks)
- ✅ Access control (only creators resolve)
- ✅ Time-locks (betting windows enforced)
- ⚠️ Add reentrancy guards
- ⚠️ Add rate limiting
- ⚠️ Add slippage protection

