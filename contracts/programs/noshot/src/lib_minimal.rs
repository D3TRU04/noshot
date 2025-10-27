use anchor_lang::prelude::*;

declare_id!("8HL3MB3Gdqcx2nWd6odgqeFjwKKP88X7pHq1xBcFLQ1m");

#[program]
pub mod noshot {
    use super::*;

    pub fn create_group(ctx: Context<CreateGroup>, code: String) -> Result<()> {
        let group = &mut ctx.accounts.group;
        group.code = code;
        msg!("Group created");
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(code: String)]
pub struct CreateGroup<'info> {
    #[account(init, payer = user, space = 8 + 32)]
    pub group: Account<'info, Group>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Group {
    pub code: String,
}

