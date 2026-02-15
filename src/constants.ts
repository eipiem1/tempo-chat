import { Address, defineChain } from "viem";

export const TEMPO_MODERATO = defineChain({
  id: 42431,
  name: "Tempo Moderato",
  nativeCurrency: { name: "AlphaUSD", symbol: "aUSD", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.moderato.tempo.xyz"] },
  },
});

export const TOKENS = {
  pathUSD: "0x20c0000000000000000000000000000000000000" as Address,
  alphaUsd: "0x20c0000000000000000000000000000000000001" as Address,
  betaUsd: "0x20c0000000000000000000000000000000000002" as Address,
  thetaUsd: "0x20c0000000000000000000000000000000000003" as Address,
} as const;

export const TOKEN_SYMBOLS: Record<Address, string> = {
  [TOKENS.pathUSD]: "pathUSD",
  [TOKENS.alphaUsd]: "AlphaUSD",
  [TOKENS.betaUsd]: "BetaUSD",
  [TOKENS.thetaUsd]: "ThetaUSD",
};

export const TOKEN_DECIMALS: Record<Address, number> = {
  [TOKENS.pathUSD]: 6,
  [TOKENS.alphaUsd]: 6,
  [TOKENS.betaUsd]: 6,
  [TOKENS.thetaUsd]: 6,
};

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000" as Address;
