const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GPP Vault System", function () {
  let authManager, secureVault;
  let owner, user, attacker;
  let chainId;

  beforeEach(async function () {
    [owner, user, attacker] = await ethers.getSigners();
    
    // Deploy Auth
    authManager = await ethers.deployContract("AuthorizationManager");
    await authManager.waitForDeployment();

    // Deploy Vault
    secureVault = await ethers.deployContract("SecureVault", [authManager.target]);
    await secureVault.waitForDeployment();

    // Fund Vault
    await owner.sendTransaction({
      to: secureVault.target,
      value: ethers.parseEther("10.0")
    });

    const network = await ethers.provider.getNetwork();
    chainId = network.chainId;
  });

  async function createSignature(recipient, amount, nonce, deadline, vaultAddress) {
    const domain = {
      name: "GPPVaultAuth",
      version: "1",
      chainId: chainId,
      verifyingContract: authManager.target
    };

    const types = {
      Withdrawal: [
        { name: "vault", type: "address" },
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    };

    const value = {
      vault: vaultAddress,
      recipient: recipient.address,
      amount: amount,
      nonce: nonce,
      deadline: deadline
    };

    return await owner.signTypedData(domain, types, value);
  }

  it("Should allow withdrawal with valid signature", async function () {
    const amount = ethers.parseEther("1.0");
    const nonce = 1;
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const signature = await createSignature(user, amount, nonce, deadline, secureVault.target);

    await expect(secureVault.connect(user).withdraw(amount, nonce, deadline, signature))
      .to.changeEtherBalances([secureVault, user], [-amount, amount]);
  });

  it("Should fail if signature is reused (Replay Attack)", async function () {
    const amount = ethers.parseEther("1.0");
    const nonce = 123;
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const signature = await createSignature(user, amount, nonce, deadline, secureVault.target);

    // First success
    await secureVault.connect(user).withdraw(amount, nonce, deadline, signature);

    // Second attempt - should fail
    await expect(secureVault.connect(user).withdraw(amount, nonce, deadline, signature))
      .to.be.revertedWithCustomError(authManager, "AuthorizationUsed");
  });

  it("Should fail if parameters are tampered with", async function () {
    const amount = ethers.parseEther("1.0");
    const nonce = 55;
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const signature = await createSignature(user, amount, nonce, deadline, secureVault.target);

    // User tries to withdraw 2.0 ETH instead of 1.0 using the 1.0 sig
    await expect(secureVault.connect(user).withdraw(ethers.parseEther("2.0"), nonce, deadline, signature))
      .to.be.revertedWithCustomError(authManager, "InvalidSignature");
  });
});