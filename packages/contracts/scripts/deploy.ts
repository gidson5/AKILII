import { ethers, network } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying PolicyRouter with account:", deployer.address);

  const PolicyRouter = await ethers.getContractFactory("PolicyRouter");
  const router = await PolicyRouter.deploy(deployer.address);
  await router.waitForDeployment();

  const address = await router.getAddress();
  const deployTx = router.deploymentTransaction();

  console.log("\n✓ PolicyRouter deployed");
  console.log("  Address:", address);
  console.log("  Owner:  ", deployer.address);
  if (deployTx) {
    console.log("  Tx hash:", deployTx.hash);
    if (network.name === "celo") {
      console.log(`  Celoscan: https://celoscan.io/address/${address}`);
      console.log(`\nTo verify:\n  CELOSCAN_API_KEY=<key> npx hardhat verify --network celo ${address} ${deployer.address}`);
    }
  }

  // Save deployment record
  const record = {
    network: network.name,
    chainId: network.config.chainId,
    deployedAt: new Date().toISOString().slice(0, 10),
    contracts: {
      PolicyRouter: {
        address,
        owner: deployer.address,
        txHash: deployTx?.hash
      }
    }
  };

  const outDir = join(__dirname, "../deployments");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${network.name}.json`), JSON.stringify(record, null, 2));
  console.log(`\n  Saved to deployments/${network.name}.json`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
