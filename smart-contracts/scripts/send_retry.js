const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config({ path: "../.env" });

async function main() {
    console.log("🚀 Retrying User Token Transfer...");

    const [signer] = await ethers.getSigners();
    const tokenAddress = "0x55d34f6e95aE41a5B61064684bdD5EFAE0e4b6d0"; // New Deployment
    const userAddress = "0x0eaC02BbEA586Cd72335093c5952D2E88e411FAf";
    const amount = ethers.parseEther("10000");

    const Token = await ethers.getContractAt("GemFinderToken", tokenAddress, signer);

    // Get current gas price and boost it slightly
    const feeData = await ethers.provider.getFeeData();
    const boostedGasPrice = feeData.gasPrice ? (feeData.gasPrice * 120n) / 100n : undefined;

    console.log(`   Sending 10,000 GFT to ${userAddress}`);
    console.log(`   Gas Price: ${ethers.formatUnits(boostedGasPrice || 0, "gwei")} gwei`);

    try {
        const tx = await Token.transfer(userAddress, amount, {
            gasPrice: boostedGasPrice
        });
        console.log(`   Tx Hash: ${tx.hash}`);
        console.log("   Waiting for confirmation...");
        await tx.wait();
        console.log("✅ Transfer Successful!");
    } catch (error) {
        console.error("❌ Transfer Failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
