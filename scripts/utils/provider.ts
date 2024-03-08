import * as anchor from "@project-serum/anchor";
import { ConfirmOptions } from "@solana/web3.js";
import bs58 from "bs58";
require("dotenv").config();

const rpc = anchor.web3.clusterApiUrl("devnet");
const options: ConfirmOptions = {
    preflightCommitment: 'processed'
}

export const getProvider = (deployer: anchor.web3.Keypair) => {
    const connection = new anchor.web3.Connection(rpc);
    
    return new anchor.AnchorProvider( 
        connection,
        new anchor.Wallet(deployer),
        options
    )
}


export const getDeployer = () => {
    try {
        var b = bs58.decode(process.env.PRIVATE_KEY);
        var j = new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
        return anchor.web3.Keypair.fromSecretKey(j)
        
    } catch {
        console.log("ERROR ********* CAN NOT GET THE PRIVATE KEY ****************")
        process.exit(1);
    }

}

export function getPdaFromSeeds(seeds: any) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Uint8Array.from(seeds)],
      new anchor.web3.PublicKey(process.env.PROGRAM_ID)
    )
}

export function getPdaFromString(program: anchor.Program, string: string) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(string)],
      program.programId
    )
}
  