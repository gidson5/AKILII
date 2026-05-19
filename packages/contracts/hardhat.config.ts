import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  paths: { sources: "./src" },
  defaultNetwork: "celo",
  networks: {
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    },
    "celo-alfajores": {
      url: "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      celo: process.env.CELOSCAN_API_KEY ?? "placeholder"
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io"
        }
      },
      {
        network: "celo-alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io"
        }
      }
    ]
  }
};

export default config;
