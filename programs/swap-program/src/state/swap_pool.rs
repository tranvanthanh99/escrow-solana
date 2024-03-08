use anchor_lang::prelude::*;

use crate::{errors::ErrorCode, SWAP_POOL_SEED};
const SOL_TO_LAMPORTS: u128 = 1000000000;

#[account]
#[derive(Default)]
pub struct SwapPool {
    pub initializer: Pubkey,     // 32
    pub swap_pool_bump: [u8; 1], // 1
    pub token_vault: Pubkey,     // 32
    pub token_mint: Pubkey,      // 32
    pub token_price: [u64; 2],   // 2 * 8
}

impl SwapPool {
    pub const LEN: usize = 8 + 113;

    pub fn seeds(&self) -> [&[u8]; 3] {
        [
            &SWAP_POOL_SEED[..],
            self.token_mint.as_ref(),
            self.swap_pool_bump.as_ref(),
        ]
    }

    pub fn get_amount_out(
        &self,
        token_decimal: u8,
        amount_in: u64,
        sol_to_token: bool,
    ) -> (u64, u64) {
        let amount_sol;
        let amount_token;

        if sol_to_token {
            amount_sol = amount_in;
            let denominator =
                amount_sol as u128 * self.token_price[0] as u128 * 10u128.pow(token_decimal as u32);
            let numerator = self.token_price[1] as u128 * SOL_TO_LAMPORTS;
            amount_token = (denominator / numerator) as u64;
        } else {
            amount_token = amount_in;
            let denominator =
            amount_token as u128 * self.token_price[1] as u128 * 10u128.pow(SOL_TO_LAMPORTS as u32);
            let numerator = self.token_price[0] as u128 * token_decimal as u128;
            amount_sol = (denominator / numerator) as u64;
        }

        (amount_sol, amount_token)
    }

    pub fn initialize(
        &mut self,
        initializer: Pubkey,
        swap_pool_bump: u8,
        token_mint: Pubkey,
        token_vault: Pubkey,
        token_price: [u64; 2],
    ) -> Result<()> {
        require!(
            token_price[0] > 0 && token_price[1] > 0,
            ErrorCode::InvalidTokenPrice
        );

        self.initializer = initializer;
        self.swap_pool_bump = [swap_pool_bump];
        self.token_mint = token_mint;
        self.token_vault = token_vault;
        self.token_price = token_price;
        Ok(())
    }
}
