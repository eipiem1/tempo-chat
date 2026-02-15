import { getPublicClient, validateAddress } from "../client.js";

export async function fundWallet(address: string): Promise<void> {
  if (!validateAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  
  const client = getPublicClient();
  
  console.log(`Requesting funds from faucet for: ${address}`);
  
  try {
    const result = await client.request({
      method: "tempo_fundAddress",
      params: [address],
    });
    
    console.log(`Faucet response:`, result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        throw new Error("Rate limited. Please try again later.");
      }
      throw error;
    }
    throw new Error("Unknown error calling faucet");
  }
}

export async function checkFaucetBalance(address: string): Promise<void> {
  if (!validateAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  
  const client = getPublicClient();
  
  try {
    const result = await client.request({
      method: "tempo_getFaucetBalance",
      params: [address],
    });
    
    console.log(`Faucet balance:`, result);
  } catch {
    console.log(`Could not fetch faucet balance`);
  }
}
