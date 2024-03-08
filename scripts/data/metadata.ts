import { UploadMetadataInput } from "@metaplex-foundation/js";

export const MINT_CONFIG = {
  numDecimals: 9,
  numberTokens: 1000000000,
};

export const MY_TOKEN_METADATA: UploadMetadataInput = {
  name: "MOVE",
  symbol: "MOVE",
  description: "MOVE token for testing swap program",
  image: "https://s2.coinmarketcap.com/static/img/coins/64x64/12953.png", //add public URL to image you'd like to use
};
