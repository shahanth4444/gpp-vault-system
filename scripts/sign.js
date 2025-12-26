// scripts/sign.js
const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  
  // CONFIGURATION (Evaluator can change these)
  // Ensure this matches the deployed AuthorizationManager address from the docker logs
  // Since we are running local, we will fetch it or you can hardcode it if known.
  // For this script, we'll assume the evaluator inputs it or we fetch the latest deployment.
  const AUTH_MANAGER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat deployment address
  const VAULT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Default Hardhat deployment address
  
  const recipient = signer.address;
  const amount = hre.ethers.parseEther("1.0");
  const nonce = 1; // Change this for every new signature
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity

  const chainId = 31337; // Hardhat Local

  console.log("\n--- Generating Authorization ---");
  console.log(`Signer (Admin): ${signer.address}`);
  console.log(`Vault: ${VAULT_ADDRESS}`);
  console.log(`Recipient: ${recipient}`);
  console.log(`Amount: 1.0 ETH`);
  console.log(`Nonce: ${nonce}`);

  // EIP-712 Domain
  const domain = {
    name: "GPPVaultAuth",
    version: "1",
    chainId: chainId,
    verifyingContract: AUTH_MANAGER_ADDRESS
  };

  // Types
  const types = {
    Withdrawal: [
      { name: "vault", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  // Data
  const value = {
    vault: VAULT_ADDRESS,
    recipient: recipient,
    amount: amount,
    nonce: nonce,
    deadline: deadline
  };

  const signature = await signer.signTypedData(domain, types, value);

  console.log("\n--- COPY THIS DATA TO INVOKE WITHDRAW() ---");
  console.log(`Amount:    ${amount.toString()}`);
  console.log(`Nonce:     ${nonce}`);
  console.log(`Deadline:  ${deadline}`);
  console.log(`Signature: ${signature}`);
  console.log("-------------------------------------------\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});