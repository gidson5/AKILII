import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { readFileSync } from "fs";
import { join } from "path";

const AKILI_LOG     = "0xbc84e6000869E08837ecAd0a26D43f7731982E8F" as const;
const AGENT_ADDRESS = (process.env.NEW_AGENT_ADDRESS ?? "") as `0x${string}`;

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set");
  if (!AGENT_ADDRESS || !/^0x[0-9a-fA-F]{40}$/.test(AGENT_ADDRESS)) {
    throw new Error("NEW_AGENT_ADDRESS not set or invalid");
  }

  const abi = parseAbi(["function setAgent(address agent, bool allowed) external"]);
  const account = privateKeyToAccount(`0x${pk}`);
  const transport = http("https://forno.celo.org");
  const walletClient = createWalletClient({ account, chain: celo, transport });
  const publicClient = createPublicClient({ chain: celo, transport });

  console.log("Owner:", account.address);
  console.log("Granting agent role to:", AGENT_ADDRESS);

  const hash = await walletClient.writeContract({
    address: AKILI_LOG,
    abi,
    functionName: "setAgent",
    args: [AGENT_ADDRESS, true],
  });

  console.log("Tx:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Confirmed in block:", receipt.blockNumber.toString());
  console.log(`Celoscan: https://celoscan.io/tx/${hash}`);

  // Update deployments/celo.json with agent address
  const deploymentsPath = join(__dirname, "../deployments/celo.json");
  const deployments = JSON.parse(readFileSync(deploymentsPath, "utf-8"));
  deployments.contracts.AkiliLog.agent = AGENT_ADDRESS;
  require("fs").writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("Updated deployments/celo.json with agent address");
}

main().catch(e => { console.error(e); process.exit(1); });
