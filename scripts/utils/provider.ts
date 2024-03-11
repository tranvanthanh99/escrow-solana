import * as anchor from "@project-serum/anchor";
import { ConfirmOptions } from "@solana/web3.js";
import bs58 from "bs58";
require("dotenv").config();

const rpc = anchor.web3.clusterApiUrl("devnet");

export const getProvider = (deployer: anchor.web3.Keypair) => {
  const connection = new anchor.web3.Connection(rpc);

  return new anchor.AnchorProvider(connection, new anchor.Wallet(deployer), {
    preflightCommitment: "processed",
    commitment: "finalized",
  });
};

export const getDeployer = () => {
  try {
    var b = bs58.decode(process.env.PRIVATE_KEY);
    var j = new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    return anchor.web3.Keypair.fromSecretKey(j);
  } catch {
    console.log("Error: Cannot get pk");
    process.exit(1);
  }
};

export function getPdaFromSeeds(seeds: any) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Uint8Array.from(seeds)],
    new anchor.web3.PublicKey(process.env.PROGRAM_ID)
  );
}

export function getPdaFromString(program: anchor.Program, string: string) {
  return anchor.web3.PublicKey.findProgramAddressSync([Buffer.from(string)], program.programId);
}

export function convertPrivateKey(privateKeyByteArray: Uint8Array) {
  // Convert the byte array to a Base58 string
  const privateKeyBase58 = bs58.encode(privateKeyByteArray);

  console.log("Private Key in Base58:", privateKeyBase58);
}
