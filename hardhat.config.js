require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337 // Standard Hardhat Chain ID
    },
    docker: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  }
};