use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("8HL3MB3Gdqcx2nWd6odgqeFjwKKP88X7pHq1xBcFLQ1m");

#[program]
pub mod noshot {
    use super::*;

    /// Create a new betting group with USDC vault
    pub fn create_group(
        ctx: Context<CreateGroup>,
        code: String,
        max_members: Option<u8>,
        bet_duration_hours: u64,
        bet_description: String,
    ) -> Result<()> {
        let group = &mut ctx.accounts.group;
        group.creator = ctx.accounts.creator.key();
        group.code = code;
        group.max_members = max_members;
        group.bet_duration_hours = bet_duration_hours;
        group.bet_description = bet_description;
        group.bets_open = true;
        group.created_at = Clock::get()?.unix_timestamp;
        group.member_count = 0;
        group.total_yes = 0;
        group.total_no = 0;
        
        msg!("Group created: {}", group.code);
        Ok(())
    }

    /// Place a bet and transfer USDC to vault
    pub fn place_bet(ctx: Context<PlaceBet>, side: BetSide, amount: u64) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let group = &mut ctx.accounts.group;
        
        // Check if betting is still open
        require!(group.bets_open, NoshotError::BettingClosed);
        
        // Check time hasn't expired
        let current_time = Clock::get()?.unix_timestamp;
        let expiry_time = group.created_at + (group.bet_duration_hours as i64 * 3600);
        require!(current_time < expiry_time, NoshotError::BettingExpired);
        
        // Transfer USDC from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.key(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;
        
        // Update member bet
        member.bet_side = Some(side);
        member.amount_bet = amount;
        
        // Update group totals
        match side {
            BetSide::Yes => group.total_yes += amount,
            BetSide::No => group.total_no += amount,
        }
        
        msg!("Bet placed: {:?} for {} USDC (1 SOL = 1 vote)", side, amount);
        Ok(())
    }

    /// Resolve the bet and prepare for winnings distribution
    pub fn resolve_bet(ctx: Context<ResolveBet>, winning_side: BetSide) -> Result<()> {
        let group = &mut ctx.accounts.group;
        
        require!(!group.bets_open, NoshotError::AlreadyResolved);
        
        group.bets_open = false;
        group.winning_side = Some(winning_side);
        group.resolved_at = Some(Clock::get()?.unix_timestamp);
        
        let total_pool = group.total_yes + group.total_no;
        msg!("Bet resolved. Winning side: {:?}", winning_side);
        msg!("Total pool: {} USDC", total_pool);
        
        Ok(())
    }

    /// Claim winnings - proportional share system
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let member = &ctx.accounts.member;
        let group = &ctx.accounts.group;
        let vault = &ctx.accounts.vault_token_account;
        
        require!(!group.bets_open, NoshotError::NotResolved);
        
        let winning_side = group.winning_side.ok_or(NoshotError::NotResolved)?;
        
        // Only winners can claim
        require!(
            member.bet_side == Some(winning_side),
            NoshotError::LostBet
        );
        
        // Calculate proportional payout
        // Winners get their stake back + proportional share of losing side's pool
        
        let winner_pool = match winning_side {
            BetSide::Yes => group.total_yes,
            BetSide::No => group.total_no,
        };
        
        let loser_pool = match winning_side {
            BetSide::Yes => group.total_no,
            BetSide::No => group.total_yes,
        };
        
        // Calculate winner's share of the losing pool
        let winners_share_of_loser_pool = (member.amount_bet as u128)
            .checked_mul(loser_pool as u128)
            .unwrap()
            .checked_div(winner_pool as u128)
            .unwrap() as u64;
        
        // Total payout = stake back + proportional share of losing pool
        let total_payout = member.amount_bet + winners_share_of_loser_pool;
        
        msg!("Claiming {} USDC (stake: {} + share: {})", total_payout, member.amount_bet, winners_share_of_loser_pool);
        
        // Transfer winnings from vault to user
        let seeds = &[b"vault", group.key().as_ref(), &[ctx.bumps.vault]];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: vault.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, total_payout)?;
        
        msg!("Winnings claimed successfully");
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
    
    #[account(
        init,
        payer = creator,
        token::mint = mint,
        token::authority = vault_authority,
        seeds = [b"vault", group.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"vault-authority", group.key().as_ref()],
        bump
    )]
    pub vault_authority: SystemAccount<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut, constraint = member.group == group.key() @ NoshotError::InvalidMember)]
    pub member: Account<'info, Member>,
    
    #[account(mut)]
    pub group: Account<'info, Group>,
    
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
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
    #[account(constraint = member.group == group.key() @ NoshotError::InvalidMember)]
    pub member: Account<'info, Member>,
    
    pub group: Account<'info, Group>,
    
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Group {
    pub creator: Pubkey,
    pub code: String,
    pub max_members: Option<u8>,
    pub bet_duration_hours: u64,
    pub bet_description: String,
    pub bets_open: bool,
    pub winning_side: Option<BetSide>,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
    pub member_count: u16,
    pub total_yes: u64,
    pub total_no: u64,
}

impl Group {
    pub const LEN: usize = 32 + 16 + 1 + 8 + 256 + 1 + 1 + 8 + 8 + 2 + 8 + 8;
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
    #[msg("Bet already resolved")]
    AlreadyResolved,
    #[msg("Insufficient pool")]
    InsufficientPool,
}

