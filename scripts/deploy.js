const hre = require("hardhat");

async function main() {
  console.log("Starting Deployment...");

  // 1. Deploy AuthorizationManager
  const AuthManager = await hre.ethers.getContractFactory("AuthorizationManager");
  const authManager = await AuthManager.deploy();
  await authManager.waitForDeployment();
  const authAddr = await authManager.getAddress();
  console.log(`AuthorizationManager deployed to: ${authAddr}`);

  // 2. Deploy SecureVault
  const SecureVault = await hre.ethers.getContractFactory("SecureVault");
  const secureVault = await SecureVault.deploy(authAddr);
  await secureVault.waitForDeployment();
  const vaultAddr = await secureVault.getAddress();
  console.log(`SecureVault deployed to: ${vaultAddr}`);

  // 3. Fund the Vault (Optional, for demo)
  const [deployer] = await hre.ethers.getSigners();
  await deployer.sendTransaction({
    to: vaultAddr,
    value: hre.ethers.parseEther("10.0")
  });
  console.log("Vault funded with 10 ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});