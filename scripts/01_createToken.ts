import * as anchor from "@project-serum/anchor";
import { getDeployer, getProvider } from "./utils/provider";
import {
  Metaplex,
  UploadMetadataInput,
  bundlrStorage,
  findMetadataPda,
  keypairIdentity,
} from "@metaplex-foundation/js";
import { DataV2, createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  getMint,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
require("dotenv").config();
import { MY_TOKEN_METADATA, MINT_CONFIG } from "./data/metadata";
import { promises as fsPromises } from "fs";
import { SAVE_PATH } from "./utils/const";

const endpoint = anchor.web3.clusterApiUrl("devnet"); //Replace with your RPC Endpoint
const solanaConnection = new anchor.web3.Connection(endpoint);

const ON_CHAIN_METADATA = {
  name: MY_TOKEN_METADATA.name,
  symbol: MY_TOKEN_METADATA.symbol,
  uri: "TO_UPDATE_LATER",
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null,
} as DataV2;

const deployer: anchor.web3.Keypair = getDeployer();
const provider: anchor.AnchorProvider = getProvider(deployer);

const uploadMetadata = async (wallet: Keypair, tokenMetadata: UploadMetadataInput): Promise<string> => {
  //create metaplex instance on devnet using this wallet
  const metaplex = Metaplex.make(solanaConnection)
    .use(keypairIdentity(wallet))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: endpoint,
        timeout: 60000,
      })
    );

  //Upload to Arweave
  const { uri } = await metaplex.nfts().uploadMetadata(tokenMetadata);
  console.log(`Arweave URL: `, uri);
  return uri;
};

const createNewMintTransaction = async (
  connection: Connection,
  payer: Keypair,
  mintKeypair: Keypair,
  destinationWallet: PublicKey,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey
) => {
  //Get the minimum lamport balance to create a new account and avoid rent payments
  const requiredBalance = await getMinimumBalanceForRentExemptMint(connection);
  //metadata account associated with mint
  const metadataPDA = await findMetadataPda(mintKeypair.publicKey);
  //get associated token account of your wallet
  const tokenATA = await getAssociatedTokenAddress(mintKeypair.publicKey, destinationWallet);

  const createNewTokenTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: requiredBalance,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey, //Mint Address
      MINT_CONFIG.numDecimals, //Number of Decimals of New mint
      mintAuthority, //Mint Authority
      freezeAuthority, //Freeze Authority
      TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountInstruction(
      payer.publicKey, //Payer
      tokenATA, //Associated token account
      payer.publicKey, //token owner
      mintKeypair.publicKey //Mint
    ),
    createMintToInstruction(
      mintKeypair.publicKey, //Mint
      tokenATA, //Destination Token Account
      mintAuthority, //Authority
      MINT_CONFIG.numberTokens * Math.pow(10, MINT_CONFIG.numDecimals) //number of tokens
    ),
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mintKeypair.publicKey,
        mintAuthority: mintAuthority,
        payer: payer.publicKey,
        updateAuthority: mintAuthority,
      },
      {
        createMetadataAccountArgsV3: {
          data: ON_CHAIN_METADATA,
          isMutable: true,
          collectionDetails: null,
        },
      }
    )
  );

  return createNewTokenTransaction;
};

const createToken = async (wallet: anchor.web3.Keypair) => {
  // Upload metadata to Arweave
  console.log(`Uploading metadata to Arweave...`);
  let metadataUri = await uploadMetadata(wallet, MY_TOKEN_METADATA);
  ON_CHAIN_METADATA.uri = metadataUri;

  let mint_pk = Keypair.generate();
  console.log(`New token Address: `, mint_pk.publicKey.toString());

  const newMintTransaction: Transaction = await createNewMintTransaction(
    solanaConnection,
    wallet,
    mint_pk,
    wallet.publicKey,
    wallet.publicKey,
    wallet.publicKey
  );

  // Send the transaction
  console.log(`Sending create mint transaction...`);
  const transactionId = await solanaConnection.sendTransaction(newMintTransaction, [wallet, mint_pk]);
  console.log(`Transaction ID: `, transactionId);
  
  console.log(
    `Succesfully minted ${MINT_CONFIG.numberTokens} ${ON_CHAIN_METADATA.symbol} to ${wallet.publicKey.toString()}.`
  );
  console.log(`View Transaction: https://explorer.solana.com/tx/${transactionId}?cluster=devnet`);
  console.log(`View Token Mint: https://explorer.solana.com/address/${mint_pk.publicKey.toString()}?cluster=devnet`);

  const deployedAddress = JSON.parse((await fsPromises.readFile(SAVE_PATH)).toString());
  const data = {
    ...deployedAddress,
    "MOVE_TOKEN": mint_pk.publicKey.toString(),
  };
  await fsPromises.writeFile(SAVE_PATH, JSON.stringify(data, null, 2));
  console.log(`Token Address saved to ${SAVE_PATH}`);
};

const main = async () => {
  anchor.setProvider(provider);
  const wallet = new anchor.Wallet(deployer);
  createToken(wallet.payer);
};

main().catch((error) => console.log(error));
