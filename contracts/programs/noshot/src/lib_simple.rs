use anchor_lang::prelude::*;

declare_id!("8HL3MB3Gdqcx2nWd6odgqeFjwKKP88X7pHq1xBcFLQ1m");

#[program]
pub mod noshot {
    use super::*;

    pub fn create_group(ctx: Context<CreateGroup>, code: String, bet_description: String) -> Result<()> {
        let group = &mut ctx.accounts.group;
        group.creator = ctx.accounts.creator.key();
        group.code = code;
        group.bet_description = bet_description;
        group.bets_open = true;
        group.total_yes = 0;
        group.total_no = 0;
        group.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Group created: {}", group.code);
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, side: u8, amount: u64) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let bet = &mut ctx.accounts.bet;
        
        require!(group.bets_open, NoshotError::BettingClosed);
        
        bet.bettor = ctx.accounts.bettor.key();
        bet.group = group.key();
        bet.side = side;
        bet.amount = amount;
        bet.placed_at = Clock::get()?.unix_timestamp;
        
        // Update pool totals
        if side == 0 {
            group.total_yes += amount;
        } else {
            group.total_no += amount;
        }
        
        msg!("Bet placed on side {} with {} tokens", if side == 0 { "YES" } else { "NO" }, amount);
        Ok(())
    }

    pub fn resolve_bet(ctx: Context<ResolveBet>, winning_side: u8) -> Result<()> {
        let group = &mut ctx.accounts.group;
        
        require!(ctx.accounts.resolver.key() == group.creator, NoshotError::Unauthorized);
        
        group.bets_open = false;
        group.winning_side = Some(winning_side);
        group.resolved_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("Bet resolved with winning side: {}", if winning_side == 0 { "YES" } else { "NO" });
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
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,
    
    #[account(
        init,
        payer = bettor,
        space = 8 + Bet::LEN,
        seeds = [b"bet", group.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveBet<'info> {
    #[account(mut, constraint = group.creator == resolver.key() @ NoshotError::Unauthorized)]
    pub group: Account<'info, Group>,
    
    pub resolver: Signer<'info>,
}

#[account]
pub struct Group {
    pub creator: Pubkey,
    pub code: String,
    pub bet_description: String,
    pub bets_open: bool,
    pub winning_side: Option<u8>,
    pub total_yes: u64,
    pub total_no: u64,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
}

impl Group {
    pub const LEN: usize = 32 + 32 + 256 + 1 + 1 + 8 + 8 + 8 + 8;
}

#[account]
pub struct Bet {
    pub bettor: Pubkey,
    pub group: Pubkey,
    pub side: u8,
    pub amount: u64,
    pub placed_at: i64,
}

impl Bet {
    pub const LEN: usize = 32 + 32 + 1 + 8 + 8;
}

#[error_code]
pub enum NoshotError {
    #[msg("Betting is closed")]
    BettingClosed,
    #[msg("Unauthorized")]
    Unauthorized,
}

