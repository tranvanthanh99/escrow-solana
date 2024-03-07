use anchor_lang::prelude::*;
use anchor_spl::token;

use crate::{errors::ErrorCode, SWAP_POOL_SEED};

#[account]
#[derive(Default)]
pub struct SwapPool {
    pub pool_bump: [u8; 1],       // 1
    pub token_mint_move: Pubkey,  // 32
    pub token_vault_move: Pubkey, // 32
    pub token_price: [u64; 2],    // 2 * 8
}

impl SwapPool {
    pub const LEN: usize = 8 + 32 + 32 + 2 * 8;

    pub fn seeds(&self) -> [&[u8]; 3] {
        [
            &SWAP_POOL_SEED[..],
            self.token_mint_move.as_ref(),
            self.pool_bump.as_ref(),
        ]
    }

    pub fn initialize(
        &mut self,
        pool_bump: u8,
        token_mint_move: Pubkey,
        token_vault_move: Pubkey,
        token_price: [u64; 2],
    ) -> Result<()> {
        require!(
            token_price[0] > 0 && token_price[1] > 0,
            ErrorCode::InvalidTokenPrice
        );

        self.pool_bump = [pool_bump];
        self.token_mint_move = token_mint_move;
        self.token_vault_move = token_vault_move;
        self.token_price = token_price;
        Ok(())
    }
}
