use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("8HL3MB3Gdqcx2nWd6odgqeFjwKKP88X7pHq1xBcFLQ1m");

#[program]
pub mod noshot {
    use super::*;

    /// Create a new betting group
    pub fn create_group(
        ctx: Context<CreateGroup>,
        code: String,
        max_members: Option<u8>,
        bet_duration_hours: u64,
        bet_amount: u64,
        bet_description: String,
    ) -> Result<()> {
        let group = &mut ctx.accounts.group;
        group.creator = ctx.accounts.creator.key();
        group.code = code;
        group.max_members = max_members;
        group.bet_duration_hours = bet_duration_hours;
        group.bet_amount = bet_amount;
        group.bet_description = bet_description;
        group.bets_open = true;
        group.created_at = Clock::get()?.unix_timestamp;
        group.member_count = 0;
        
        msg!("Group created: {}", group.code);
        Ok(())
    }

    /// Join a betting group
    pub fn join_group(ctx: Context<JoinGroup>) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let member = &mut ctx.accounts.member;
        
        // Check if group is open
        require!(group.bets_open, NoshotError::BettingClosed);
        
        // Check member limit
        if let Some(max) = group.max_members {
            require!(group.member_count < max as u16, NoshotError::GroupFull);
        }
        
        member.wallet = ctx.accounts.payer.key();
        member.group = group.key();
        member.bet_side = None;
        member.amount_bet = 0;
        
        group.member_count += 1;
        
        msg!("Member joined group: {}", group.code);
        Ok(())
    }

    /// Place a bet on a side
    pub fn place_bet(ctx: Context<PlaceBet>, side: BetSide, amount: u64) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let group = &ctx.accounts.group;
        
        // Check if betting is still open
        require!(group.bets_open, NoshotError::BettingClosed);
        
        // Check time hasn't expired
        let current_time = Clock::get()?.unix_timestamp;
        let expiry_time = group.created_at + (group.bet_duration_hours as i64 * 3600);
        require!(current_time < expiry_time, NoshotError::BettingExpired);
        
        // Update member bet
        member.bet_side = Some(side);
        member.amount_bet = amount;
        
        msg!("Bet placed: {:?} for {} USDC", side, amount);
        Ok(())
    }

    /// Resolve the bet and distribute winnings
    pub fn resolve_bet(ctx: Context<ResolveBet>, winning_side: BetSide) -> Result<()> {
        let group = &mut ctx.accounts.group;
        
        group.bets_open = false;
        group.winning_side = Some(winning_side);
        group.resolved_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("Bet resolved with winning side: {:?}", winning_side);
        Ok(())
    }

    /// Claim winnings after bet is resolved
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let member = &ctx.accounts.member;
        let group = &ctx.accounts.group;
        
        require!(!group.bets_open, NoshotError::NotResolved);
        
        let winning_side = group.winning_side.ok_or(NoshotError::NotResolved)?;
        require!(
            member.bet_side == Some(winning_side),
            NoshotError::LostBet
        );
        
        // Transfer winnings (simplified - in production, calculate actual winnings pool)
        msg!("Claimed winnings for member: {:?}", member.wallet);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(code: String)]
pub struct CreateGroup<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Group::LEN,
        seeds = [b"group", code.as_bytes()],
        bump
    )]
    pub group: Account<'info, Group>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGroup<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,
    
    #[account(
        init,
        payer = payer,
        space = 8 + Member::LEN,
        seeds = [b"member", group.key().as_ref(), payer.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,
    
    #[account(
        mut,
        constraint = member.group == group.key() @ NoshotError::InvalidMember
    )]
    pub member: Account<'info, Member>,
    
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveBet<'info> {
    #[account(
        mut,
        constraint = group.creator == resolver.key() @ NoshotError::Unauthorized
    )]
    pub group: Account<'info, Group>,
    
    pub resolver: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        constraint = member.group == group.key() @ NoshotError::InvalidMember
    )]
    pub member: Account<'info, Member>,
    
    pub group: Account<'info, Group>,
}

#[account]
pub struct Group {
    pub creator: Pubkey,
    pub code: String,
    pub max_members: Option<u8>,
    pub bet_duration_hours: u64,
    pub bet_amount: u64,
    pub bet_description: String,
    pub bets_open: bool,
    pub winning_side: Option<BetSide>,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
    pub member_count: u16,
}

impl Group {
    pub const LEN: usize = 32 + 16 + 1 + 8 + 8 + 256 + 1 + 1 + 8 + 8 + 2;
}

#[account]
pub struct Member {
    pub wallet: Pubkey,
    pub group: Pubkey,
    pub bet_side: Option<BetSide>,
    pub amount_bet: u64,
}

impl Member {
    pub const LEN: usize = 32 + 32 + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum BetSide {
    Yes,
    No,
}

#[error_code]
pub enum NoshotError {
    #[msg("Betting is closed")]
    BettingClosed,
    #[msg("Group is full")]
    GroupFull,
    #[msg("Betting period has expired")]
    BettingExpired,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid member")]
    InvalidMember,
    #[msg("Bet not resolved yet")]
    NotResolved,
    #[msg("You lost the bet")]
    LostBet,
}
