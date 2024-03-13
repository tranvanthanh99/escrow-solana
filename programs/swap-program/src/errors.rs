use std::num::TryFromIntError;

use anchor_lang::prelude::*;

#[error_code]
#[derive(PartialEq)]
pub enum ErrorCode {
    #[msg("Unable to cast number into BigInt")]
    NumberCastError, //  0x1777

    #[msg("Invalid token price")]
    InvalidTokenPrice,

    #[msg("Invalid swap amount")]
    InvalidSwapAmount,

    #[msg("Insufficient fund to swap")]
    InsufficientFund,
}

impl From<TryFromIntError> for ErrorCode {
    fn from(_: TryFromIntError) -> Self {
        ErrorCode::NumberCastError
    }
}
