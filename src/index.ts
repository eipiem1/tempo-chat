import dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Command } from "commander";
import { createWallet } from "./wallet/create.js";
import { listWalletsCommand } from "./wallet/list.js";
import { getWallet, resolveAddress } from "./wallet/resolve.js";
import { fundWallet } from "./wallet/fund.js";
import { balanceCommand } from "./operations/balance.js";
import { sendCommand } from "./operations/send.js";
import { swapCommand } from "./operations/swap.js";
import { parseNaturalLanguage, executeParsedOperation } from "./llm/parser.js";
import readline from "readline";

const program = new Command();

program
  .name("tempo-cli")
  .description(`Natural language CLI for Tempo blockchain operations

Examples:
  tempo-cli                                     # Natural language interactive mode (no args)
  tempo-cli wallet list                         # List wallets
  tempo-cli send 10 aUSD 0xABC... -w mywallet   # Send tokens
  
  Address formats: 0x..., alias, email, phone`)
  .version("0.1.0")
  .option("-d, --debug", "Show debug output in interactive mode");

const walletCmd = program
  .command("wallet")
  .description("Wallet management(create, list, balance, fund)");

walletCmd
  .command("create")
  .description("Create a new wallet")
  .option("-f, --fund", "Fund wallet from faucet after creation")
  .option("-a, --alias <name>", "Wallet alias/name")
  .action(async (options) => {
    try {
      await createWallet({
        alias: options.alias,
        fund: options.fund,
      });
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

walletCmd
  .command("list")
  .description("List all stored wallets")
  .action(() => {
    listWalletsCommand();
  });

walletCmd
  .command("fund")
  .description("Fund wallet from faucet")
  .argument("<address>", "Wallet address, alias, email, or phone")
  .action(async (address) => {
    try {
      const resolved = await resolveAddress(address);
      await fundWallet(resolved);
      console.log("Funding complete!");
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

walletCmd
  .command("balance")
  .description("Check wallet balance")
  .argument("<address>", "Wallet address, alias, email, or phone")
  .action(async (address) => {
    try {
      const resolved = await resolveAddress(address);
      await balanceCommand(resolved);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("send")
  .description("Send tokens to a receiver")
  .argument("<amount>", "Amount to send")
  .argument("<token>", "Token symbol (aUSD, bUSD, tUSD, pathUSD)")
  .argument("<recipient>", "Recipient address, alias, email, or phone")
  .option("-m, --memo <text>", "Optional memo")
  .option("-k, --private-key <key>", "Sender private key")
  .option("-w, --wallet <alias>", "Sender wallet alias/address/email/phone")
  .action(async (amount, token, recipient, options) => {
    try {
      let senderWallet = options.wallet;
      if (senderWallet) {
        const resolved = await resolveAddress(senderWallet);
        senderWallet = resolved;
      }
      await sendCommand({
        amount,
        token,
        to: recipient,
        memo: options.memo,
        privateKey: options.privateKey,
        walletAlias: senderWallet,
      });
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("balance")
  .description("Check wallet balance")
  .argument("[address]", "Wallet address, alias, email, or phone")
  .action(async (address) => {
    if (!address) {
      console.log("Error: Wallet address, alias, email, or phone required");
      process.exit(1);
    }
    try {
      const resolved = await resolveAddress(address);
      await balanceCommand(resolved);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("swap")
  .description("Swap tokens on DEX")
  .argument("<amount>", "Amount to swap")
  .argument("<tokenIn>", "Input token symbol")
  .argument("<tokenOut>", "Output token symbol")
  .option("-s, --slippage <bps>", "Slippage in bps (default: 50)", "50")
  .option("-k, --private-key <key>", "Sender private key")
  .option("-w, --wallet <alias>", "Sender wallet alias/address/email/phone")
  .action(async (amount, tokenIn, tokenOut, options) => {
    try {
      let senderWallet = options.wallet;
      if (senderWallet) {
        const resolved = await resolveAddress(senderWallet);
        senderWallet = resolved;
      }
      await swapCommand({
        amountIn: amount,
        tokenIn,
        tokenOut,
        slippageBps: parseInt(options.slippage),
        privateKey: options.privateKey,
        walletAlias: senderWallet,
      });
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function agenticLoop(showDebug: boolean = false) {
  if (!process.stdin.isTTY) {
    console.log("Error: Interactive mode requires a terminal. Use direct commands instead.");
    console.log("Example: npx tsx src/index.ts wallet list");
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("=== Tempo CLI (Agentic Mode) ===");
  console.log("Enter a natural language command or 'help|?' for help or 'exit' to quit\n");

  let selectedWallet: string | undefined;

  const ask = (prompt: string): Promise<string> => {
    return new Promise((resolve) => rl.question(prompt, resolve));
  };

  while (true) {
    try {
      const prompt = selectedWallet 
        ? `tempo-cli [${selectedWallet.slice(0, 10)}...]> `
        : "tempo-cli> ";
      
      const input = await ask(prompt);
      
      if (!input.trim()) {
        continue;
      }
      
      const trimmed = input.trim().toLowerCase();
      
      if (trimmed === "exit" || trimmed === "quit") {
        console.log("Goodbye!");
        break;
      }
      
      if (trimmed === "help" || trimmed === "?") {
        console.log(`
Available commands:
  wallet create [--fund] [--alias <name>]  - Create new wallet
  wallet list                              - List all stored wallets
  wallet fund <address>                    - Fund wallet from faucet
  wallet balance <address>                 - Check wallet balance
  send <amount> <token> <recipient>        - Send tokens
  swap <amount> <tokenIn> <tokenOut>       - Swap tokens on DEX
  balance [address]                        - Check wallet balance

Examples (natural language):
  "list my wallets"       -> wallet list
  "create wallet"         -> wallet create
  "check balance"         -> balance
  "send 10 aUSD to X"     -> send tokens

Address formats: 0x..., alias, email, phone

Type 'exit' to quit.
`);
        continue;
      }

      const result = await parseNaturalLanguage(input);
      
      if (showDebug) {
        console.log("Parsed:", JSON.stringify(result, null, 2));
      }

      if (result.confidence < 0.3) {
        console.log("Low confidence - please be more specific\n");
        continue;
      }

      if (result.operation === "wallet_list" || result.operation === "wallet_create") {
        await executeParsedOperation(result);
        continue;
      }

      if (result.operation === "wallet_fund" || result.operation === "wallet_balance" || result.operation === "balance") {
        if (!result.params.address) {
          const addr = await ask("Enter wallet address/alias/email/phone: ");
          result.params.address = addr.trim();
        }
        const resolved = await resolveAddress(result.params.address as string);
        result.params.address = resolved;
        await executeParsedOperation(result);
        continue;
      }

      let resolvedWallet: string | undefined;
      
      if (result.operation === "send" || result.operation === "swap") {
        if (!selectedWallet && !result.params.walletAlias) {
          const wallet = await ask("Enter wallet alias/address/email/phone: ");
          if (wallet.trim()) {
            const resolved = await resolveAddress(wallet.trim());
            selectedWallet = resolved;
            resolvedWallet = resolved;
          }
        } else if (selectedWallet) {
          resolvedWallet = selectedWallet;
        }
      }

      if (selectedWallet && !result.params.walletAlias) {
        result.params.walletAlias = selectedWallet;
      }

      await executeParsedOperation(result, {
        walletAlias: resolvedWallet || selectedWallet,
      });
      
      if (result.operation === "send" || result.operation === "swap" || result.operation === "balance") {
        const addr = result.params.address || result.params.walletAlias;
        if (addr) {
          try {
            const resolved = await resolveAddress(addr as string);
            selectedWallet = resolved;
          } catch {
            selectedWallet = addr as string;
          }
        }
      }
      
      console.log();
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error, "\n");
    }
  }

  rl.close();
}

const args = process.argv.slice(2);

// Check for debug flag before commander parses
const hasDebug = args.includes("--debug") || args.includes("-d");
// Keep -- if present (needed for passing args after --)
const doubleDash = args.includes("--") ? ["--"] : [];
const filteredArgs = [
  ...doubleDash,
  ...args.filter(a => a !== "--debug" && a !== "-d" && a !== "--")
];

if (filteredArgs.length === 0) {
  agenticLoop(hasDebug);
} else {
  const originalArgv = process.argv.slice(2);
  program.parse(originalArgv, { from: "user" });
}
