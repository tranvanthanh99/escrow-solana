use anchor_lang::{
    prelude::{AccountInfo, ProgramError},
    ToAccountInfo,
};
pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

pub fn transfer_native_from_owner_to_vault<'info>(
    from_account_info: &AccountInfo<'info>,
    to_account_info: &AccountInfo<'info>,
    amount: u64,
) -> Result<(), ProgramError> {
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        from_account_info.key,
        to_account_info.key,
        amount,
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            from_account_info.to_account_info(),
            to_account_info.to_account_info(),
        ],
    )
}

pub fn transfer_native_from_vault_to_owner<'info>(
    vault_account_info: &AccountInfo<'info>,
    owner_account_info: &AccountInfo<'info>,
    amount: u64,
) -> Result<(), ProgramError> {
    **vault_account_info
        .to_account_info()
        .try_borrow_mut_lamports()? -= amount;
    **owner_account_info
        .to_account_info()
        .try_borrow_mut_lamports()? += amount;
    Ok(())
}
