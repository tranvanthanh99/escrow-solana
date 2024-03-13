# SOLANA SWAP CONTRACT

A smart contract for swapping between SOL and MOVE tokens.

<p align="center">
  <img src="https://drive.google.com/file/d/1uBIdOUkuNw8YwqQLHadJi7cmvYL35vdN/view?usp=sharing">
</p>

## Demo

- website: http://18.138.89.217:3000/

- MOVE token mint on devnet: 3ni15tDdtH2spcGiUEKu64DbuXWbdenehMjSjaHbPTzP

- Program id on devnet: 3zQ1ZZSEPG6LeVij4pwsfE4D1RvKjGZvkNvtnzHasSVr

## Testing

To test swap program, run command below. The testing scripts is located in the `tests\` folders.

```
anchor test
```

**_NOTE:_** Before running the test, change the config in the `Anchor.toml` from devnet to localnet to test on the local.

## Interact with deployed program

### Environment

Create a new `.env` file and add your private key in base58 format

```
PRIVATE_KEY=4cm2x5xx......
```

### Create a new token

You will need some token on your wallet to test the next script. So run command below to create a new MOVE token mint and mint some MOVE tokens to your wallet.

```
ts-node scripts/01_createToken.ts
```

### Initialize swap pool

Run this command to initialize swap pool & token vault and add lp with 5 SOL & 100,000 MOVE.

```
ts-node scripts/02_initialize.ts
```

### Swap from SOL to MOVE

Run this command to swap 1 SOL to 10 MOVE

```
ts-node scripts/03_swap_sol_to_move.ts
```

### Swap from MOVE to SOL

Run this command to swap 10 MOVE to 1 SOL

```
ts-node scripts/04_swap_move_to_sol.ts
```

### Close swap pool

Run this command to close the pool, all SOL & MOVE from SwapPool & TokenVault will be returned and only initializer of the pool can close.

```
ts-node scripts/05_closePool.ts
```

## FE

run command below to start FE app.

```
cd app && yarn && yarn dev
```
