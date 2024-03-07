use anchor_lang::prelude::*;

declare_id!("3zQ1ZZSEPG6LeVij4pwsfE4D1RvKjGZvkNvtnzHasSVr");

#[program]
pub mod swap_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
