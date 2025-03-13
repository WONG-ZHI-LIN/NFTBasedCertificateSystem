require("@nomicfoundation/hardhat-toolbox"); // Optional: Install and use Hardhat Toolbox for common plugins

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // Set your desired Solidity version
  paths: {
    sources: "./contracts", // Path to your Solidity contracts
    tests: "./test", // Path to your tests
    artifacts: "./artifacts", // Path to compiled artifacts
  },
  networks: {
    // Configure networks (e.g., localhost, testnets, mainnet)
    hardhat: {
      chainId: 31337, // Default chain ID for Hardhat's local network
    },
    ganache: {
      url: "http://127.0.0.1:8545", // Ganache local network
      chainId: 1337, // Ganache default chain ID
    },
  },
};