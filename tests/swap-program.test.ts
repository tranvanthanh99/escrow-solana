import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Swapper } from "../scripts/swap/swapper";
import { createMintToken, createUserAndAssociatedWallet, getSplBalance, transferToken } from "../scripts/utils/token";
import { SwapProgram } from "../target/types/swap_program";
import * as assert from "assert";

const MOVE_DECIMAL = 6;
const MOVE_PRICE = [new anchor.BN(10), new anchor.BN(1)]; // 1 move = 0.1 SOL
const swapAmountSol = new anchor.BN(1000000000); // Bob is going to swap 1 SOL for 10 MOVE
const swapAmountMove = new anchor.BN(10000000); // Bob is going to swap 10 MOVE for 1 SOL
let expectedReceiveAmount = null; // Expected amount that Bob is going to receive
const depositAmount = 10000000; // Amount that alice use to deposit to the vault (add liquidity)

describe("solana-swap-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SwapProgram as Program<SwapProgram>;

  let swapper: Swapper;

  // We are going to work with this MOVE token latter
  let token_mint: anchor.web3.PublicKey;

  let deployer: anchor.web3.Keypair;
  let deployer_token_wallet: anchor.web3.PublicKey;

  let alice: anchor.web3.Keypair;
  let alice_token_wallet: anchor.web3.PublicKey;

  let bob: anchor.web3.Keypair;
  let bob_token_wallet: anchor.web3.PublicKey;

  const SOL_TO_LAMPORT = new anchor.BN(1000000000);

  const INITIAL_DEPLOYER_BALANCE = BigInt(1000000000000);
  const INITIAL_ALICE_TOKEN_BALANCE = BigInt(10000000000);

  it("Set up test space!", async () => {
    /**
     * token_mint: The mint address of the MOVE token.
     *
     * Swapper: the contract instance in which we can use to test and interact with the blockchain
     *
     * deployer, deployer_token_wallet: The initializer of the contract (The vault contract token - not added yet). 
     * The initializer can close pool to withdraw SOL and MOVE token from the program (Pool & vault)
     * 
     * alice - alice_token_wallet: Alice wallet is created, and she will get some MOVE tokens.  
     * Alice will be the one who provide liquidity by putting MOVE token in to the vault
     * 
     * bob - bob_token_wallet: Bob and his ata token account will be created, but he gets no MOVE token initially
     */

    token_mint = await createMintToken(provider, MOVE_DECIMAL);
    [deployer, deployer_token_wallet] = await createUserAndAssociatedWallet(
      provider,
      token_mint,
      true,
      INITIAL_DEPLOYER_BALANCE
    );
    [alice, alice_token_wallet] = await createUserAndAssociatedWallet(
      provider,
      token_mint,
      true,
      INITIAL_ALICE_TOKEN_BALANCE
    );
    [bob, bob_token_wallet] = await createUserAndAssociatedWallet(provider, token_mint, true);

    swapper = new Swapper(token_mint, provider, deployer); // add the provider and the deployer in order to use localnet
  });

  it("Initialize", async () => {
    // await swapper.simulateInitialize(deployer, MOVE_PRICE);
    await swapper.initialize(deployer, MOVE_PRICE);

    let swapPoolPDA = await swapper.getSwapPoolPDA();
    let tokenVaultPDA = await swapper.getTokenVaultPDA();

    let swapPoolInfo = await swapper.provider.connection.getAccountInfo(swapPoolPDA.key);
    let tokenVaultInfo = await swapper.provider.connection.getAccountInfo(tokenVaultPDA.key);

    assert.ok(swapPoolInfo.lamports > 0, "swapPool has not been created");
    assert.ok(tokenVaultInfo.lamports > 0, "token vault has not been created");
  });

  it("Swap - sol to move", async () => {
    const swapPoolPDA = await swapper.getSwapPoolPDA();
    let swapPoolInfo = await swapper.provider.connection.getAccountInfo(swapPoolPDA.key);
    let preSwapPoolBalance = swapPoolInfo.lamports;

    let bobInfo = await swapper.provider.connection.getAccountInfo(bob.publicKey);
    let preSwapBobBalance = bobInfo.lamports;

    const tokenVaultPDA = await swapper.getTokenVaultPDA();

    await transferToken(swapper.provider, alice_token_wallet, tokenVaultPDA.key, alice, depositAmount);

    // Bob swap - sol to move
    await swapper.swap(bob, bob_token_wallet, swapAmountSol, true);

    swapPoolInfo = await swapper.provider.connection.getAccountInfo(swapPoolPDA.key);
    let postSwapPoolBalance = swapPoolInfo.lamports;

    bobInfo = await swapper.provider.connection.getAccountInfo(bob.publicKey);
    let postSwapBobBalance = bobInfo.lamports;

    // ASSERTION
    /**
     * Pool SOL balance should increase by: 1 SOL (10^9 lamports)
     * Bob token wallet balance should increase by: 10 MOVE (10 * 10^MOVE_DECIMAL)
     */
    assert.ok(
      preSwapBobBalance - postSwapBobBalance >= swapAmountSol.toNumber(),
      "Bob balance should be deducted by an amount greater than 1 SOL"
    ); // bob pay some lamports for gas fee
    assert.ok(
      postSwapPoolBalance - preSwapPoolBalance == swapAmountSol.toNumber(),
      "vault Balance should increase by an swap amount"
    );
    let bobMoveBalance = await getSplBalance(swapper.provider, bob_token_wallet);
    expectedReceiveAmount = swapAmountSol
      .mul(MOVE_PRICE[0])
      .mul(new anchor.BN(10).pow(new anchor.BN(MOVE_DECIMAL + 1)))
      .div(MOVE_PRICE[0])
      .div(SOL_TO_LAMPORT);
    assert.ok(expectedReceiveAmount.toNumber() == Number(bobMoveBalance), "Bob receive an incorrect amount");
  });

  it("Swap - move to sol", async () => {
    const swapPoolPDA = await swapper.getSwapPoolPDA();
    let swapPoolInfo = await swapper.provider.connection.getAccountInfo(swapPoolPDA.key);
    let preSwapPoolBalance = swapPoolInfo.lamports;

    let bobInfo = await swapper.provider.connection.getAccountInfo(bob.publicKey);
    let preSwapBobBalance = bobInfo.lamports;

    const tokenVaultPDA = await swapper.getTokenVaultPDA();

    let prePoolMoveBalance = await getSplBalance(swapper.provider, tokenVaultPDA.key);

    // await swapper.simulateSwap(bob, bob_token_wallet, swapAmountMove, false);
    // process.exit()
    // Bob swap - move to sol
    await swapper.swap(bob, bob_token_wallet, swapAmountMove, false);

    let postPoolMoveBalance = await getSplBalance(swapper.provider, tokenVaultPDA.key);

    swapPoolInfo = await swapper.provider.connection.getAccountInfo(swapPoolPDA.key);
    let postSwapPoolBalance = swapPoolInfo.lamports;

    bobInfo = await swapper.provider.connection.getAccountInfo(bob.publicKey);
    let postSwapBobBalance = bobInfo.lamports;

    // ASSERTION
    /**
     * Pool MOVE balance should increase by: 10 MOVE (10 * 10^MOVE_DECIMAL)
     * Bob token wallet balance should increase by: 1 SOL (10^9 lamports)
     */
    assert.ok(
      postSwapBobBalance - preSwapBobBalance <= swapAmountSol.toNumber(),
      "Bob SOL balance should be increased by an amount less than 1 SOL"
    ); // bob pay some lamports for gas fee
    assert.ok(
      preSwapPoolBalance - postSwapPoolBalance == swapAmountSol.toNumber(),
      "Pool SOL Balance should decrease by a swap amount"
    );
    assert.ok(
      postPoolMoveBalance - prePoolMoveBalance == BigInt(swapAmountMove.toNumber()),
      "Pool MOVE Balance should increase by a swap amount"
    );

    let bobMoveBalance = await getSplBalance(swapper.provider, bob_token_wallet);
    expectedReceiveAmount = new anchor.BN(0);
    assert.ok(expectedReceiveAmount.toNumber() == Number(bobMoveBalance), "Bob receive an incorrect amount");
  });

  it("Close Pool", async () => {
    const tokenVaultPDA = await swapper.getTokenVaultPDA();
    const swapPoolPDA = await swapper.getSwapPoolPDA();

    const vaultMoveBalance = await getSplBalance(swapper.provider, tokenVaultPDA.key);

    const preTokenVaultInfo = await swapper.provider.connection.getAccountInfo(tokenVaultPDA.key);
    const preTokenVaultSolBalance = preTokenVaultInfo.lamports;

    let swapPoolInfo = await swapper.provider.connection.getAccountInfo(swapPoolPDA.key);
    let swapPoolSolBalance = swapPoolInfo.lamports;

    let deployerInfo = await swapper.provider.connection.getAccountInfo(deployer.publicKey);
    const preDeployerSolBalance = deployerInfo.lamports;

    const preDeployerMoveBalance = await getSplBalance(swapper.provider, deployer_token_wallet);

    // await swapper.simulateClosePool(deployer, deployer_token_wallet);
    await swapper.closePool(deployer, deployer_token_wallet);

    deployerInfo = await swapper.provider.connection.getAccountInfo(deployer.publicKey);
    const postDeployerSolBalance = deployerInfo.lamports;

    const postDeployerMoveBalance = await getSplBalance(swapper.provider, deployer_token_wallet);

    // check deployer balance
    assert.ok(
      postDeployerSolBalance - preDeployerSolBalance <= swapPoolSolBalance + preTokenVaultSolBalance,
      "Deployer SOL balance should be increased by the pool balance"
    );

    assert.ok(
      postDeployerMoveBalance - preDeployerMoveBalance == vaultMoveBalance,
      "Deployer MOVE balance should be increased by the pool balance"
    );

    // check if the pool and the vault are closed
    swapPoolInfo = await swapper.provider.connection.getAccountInfo(swapPoolPDA.key);

    assert.ok(swapPoolInfo === null || swapPoolInfo.lamports === 0, "Pool should be closed");

    const tokenVaultInfo = await swapper.provider.connection.getAccountInfo(tokenVaultPDA.key);

    assert.ok(tokenVaultInfo === null || tokenVaultInfo.lamports === 0, "Vault should be closed");
  });
});
