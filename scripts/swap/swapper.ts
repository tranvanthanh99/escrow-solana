import * as anchor from "@project-serum/anchor";
import * as solana from "@solana/web3.js";
import { SwapProgram } from "../../target/types/swap_program";
import { getDeployer, getProvider } from "../utils/provider";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const SWAP_POOL_PDA_SEED = "swap_pool";
const TOKEN_VAULT_PDA_SEED = "token_vault";
const NATIVE_VAULT_PDA_SEED = "native_vault";
const SWAP_POOL_SIZE = 121;

interface PDAParam {
  key: anchor.web3.PublicKey;
  bump: number;
}

export class Swapper {
  deployer: solana.Keypair;
  provider: anchor.AnchorProvider;
  program: anchor.Program<SwapProgram>;
  tokenMint: anchor.web3.PublicKey;

  constructor(tokenMint: anchor.web3.PublicKey, provider?: anchor.AnchorProvider, deployer?: anchor.web3.Keypair) {
    //local net
    if (provider) {
      this.provider = provider;

      if (!deployer) {
        console.log("Error: Require custom deployer for testing");
        process.exit(1);
      }
      this.deployer = deployer;
    }

    //devnet or mainnet
    else {
      this.deployer = getDeployer();
      this.provider = getProvider(this.deployer);
    }

    anchor.setProvider(this.provider);

    this.program = anchor.workspace.SwapProgram as anchor.Program<SwapProgram>;
    this.tokenMint = tokenMint;
    // this.id = id;
  }

  getSwapPoolRentExemptLamports = async () => {
    const lamportsForMint = await this.provider.connection.getMinimumBalanceForRentExemption(SWAP_POOL_SIZE);
    return lamportsForMint;
  };

  getSwapPoolPDA = async (): Promise<PDAParam> => {
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode(SWAP_POOL_PDA_SEED), this.tokenMint.toBuffer()],
      this.program.programId
    );

    return {
      key: pda,
      bump: bump,
    };
  };

  getTokenVaultPDA = async (): Promise<PDAParam> => {
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode(TOKEN_VAULT_PDA_SEED), this.tokenMint.toBuffer()],
      this.program.programId
    );

    return {
      key: pda,
      bump: bump,
    };
  };

  getNativeVaultPDA = async (): Promise<PDAParam> => {
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode(NATIVE_VAULT_PDA_SEED),
        // this.tokenMint.toBuffer()
      ],
      this.program.programId
    );

    return {
      key: pda,
      bump: bump,
    };
  };

  simulateInitialize = async (initializer: anchor.web3.Keypair, token_price: anchor.BN[]) => {
    let swapPoolPDA = await this.getSwapPoolPDA();
    let tokenVaultPDA = await this.getTokenVaultPDA();

    // Construct the transaction
    let transaction = new anchor.web3.Transaction();
    let instruction = await this.program.methods
      .initialize(token_price, swapPoolPDA.bump)
      .accounts({
        tokenMint: this.tokenMint,
        swapPool: swapPoolPDA.key,
        tokenVault: tokenVaultPDA.key,
        funder: initializer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: solana.SystemProgram.programId,
        rent: solana.SYSVAR_RENT_PUBKEY,
      })
      .signers([initializer])
      .instruction();

    transaction.add(instruction);

    // Simulate the transaction
    const connection = this.provider.connection;
    let simulatedTransaction = await connection.simulateTransaction(transaction, [initializer]);
    console.log(simulatedTransaction);
    return simulatedTransaction;
  };

  initialize = async (initializer: anchor.web3.Keypair, token_price: anchor.BN[]) => {
    let swapPoolPDA = await this.getSwapPoolPDA();
    let tokenVaultPDA = await this.getTokenVaultPDA();

    return await this.program.methods
      .initialize(token_price, swapPoolPDA.bump)
      .accounts({
        tokenMint: this.tokenMint,
        swapPool: swapPoolPDA.key,
        tokenVault: tokenVaultPDA.key,
        funder: initializer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: solana.SystemProgram.programId,
        rent: solana.SYSVAR_RENT_PUBKEY,
      })
      .signers([initializer])
      .rpc();
  };

  simulateSwap = async (
    user: anchor.web3.Keypair,
    tokenOwnerAccount: anchor.web3.PublicKey,
    amount: anchor.BN,
    solToToken: boolean
  ) => {
    let swapPoolPDA = await this.getSwapPoolPDA();
    let tokenVaultPDA = await this.getTokenVaultPDA();

    // Construct the transaction
    let transaction = new anchor.web3.Transaction();
    let instruction = await this.program.methods
      .swap(amount, solToToken)
      .accounts({
        signer: user.publicKey,
        tokenMint: this.tokenMint,
        swapPool: swapPoolPDA.key,
        tokenVault: tokenVaultPDA.key,
        tokenOwnerAccount: tokenOwnerAccount,
      })
      .signers([user])
      .instruction();

    transaction.add(instruction);

    // Simulate the transaction
    const connection = this.provider.connection;
    let simulatedTransaction = await connection.simulateTransaction(transaction, [user]);
    console.log(simulatedTransaction);
    return simulatedTransaction;
  };

  swap = async (
    user: anchor.web3.Keypair,
    tokenOwnerAccount: anchor.web3.PublicKey,
    amount: anchor.BN,
    solToToken: boolean
  ) => {
    let swapPoolPDA = await this.getSwapPoolPDA();
    let tokenVaultPDA = await this.getTokenVaultPDA();

    return await this.program.methods
      .swap(amount, solToToken)
      .accounts({
        signer: user.publicKey,
        tokenMint: this.tokenMint,
        swapPool: swapPoolPDA.key,
        tokenVault: tokenVaultPDA.key,
        tokenOwnerAccount: tokenOwnerAccount,
      })
      .signers([user])
      .rpc();
  };

  simulateClosePool = async (user: anchor.web3.Keypair, tokenOwnerAccount: anchor.web3.PublicKey) => {
    let swapPoolPDA = await this.getSwapPoolPDA();
    let tokenVaultPDA = await this.getTokenVaultPDA();

    // Construct the transaction
    let transaction = new anchor.web3.Transaction();
    let instruction = await this.program.methods
      .closePool()
      .accounts({
        initializer: user.publicKey,
        swapPool: swapPoolPDA.key,
        tokenVault: tokenVaultPDA.key,
        userTokenAccount: tokenOwnerAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: solana.SystemProgram.programId,
        rent: solana.SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .instruction();

    transaction.add(instruction);

    // Simulate the transaction
    const connection = this.provider.connection;
    let simulatedTransaction = await connection.simulateTransaction(transaction, [user]);
    console.log(simulatedTransaction);
    return simulatedTransaction;
  };

  closePool = async (user: anchor.web3.Keypair, tokenOwnerAccount: anchor.web3.PublicKey) => {
    let swapPoolPDA = await this.getSwapPoolPDA();
    let tokenVaultPDA = await this.getTokenVaultPDA();

    return await this.program.methods
      .closePool()
      .accounts({
        initializer: user.publicKey,
        swapPool: swapPoolPDA.key,
        tokenVault: tokenVaultPDA.key,
        userTokenAccount: tokenOwnerAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: solana.SystemProgram.programId,
        rent: solana.SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .rpc();
  };
}
