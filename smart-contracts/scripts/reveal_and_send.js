const hre = require("hardhat");
const { ethers } = hre;
require('dotenv').config({ path: '../.env' }); // Try to load root env for token address

async function main() {
    console.log("\n🔐  SECURITY CHECK & KEY REVEAL");
    console.log("---------------------------------------------------");

    // 1. Get Wallet Info
    // Note: We access process.env directly potentially loaded by Hardhat or dotenv above
    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
        console.error("❌ No PRIVATE_KEY found in .env files.");
        console.log("   Please ensure 'smart-contracts/.env' contains PRIVATE_KEY=...");
        return;
    }

    const wallet = new ethers.Wallet(pk);
    console.log("🔑 Private Key:", pk);
    console.log("👛 Wallet Address:", wallet.address);
    console.log("---------------------------------------------------\n");

    // 2. Identify Token & Target
    const tokenAddress = process.env.VITE_GFT_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_GFT_TOKEN_ADDRESS;
    const targetAddress = "0x0eaC02BbEA586Cd72335093c5952D2E88e411FAf"; // User's wallet from log

    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️  Token Address NOT FOUND in environment.");
        console.log("   Please copy the GFT address from your deployment logs into '../.env'");
        console.log("   Example: VITE_GFT_TOKEN_ADDRESS=0x...");
        console.log("\n   I cannot send tokens without the address.");
    } else {
        console.log(`🪙  Target Token: ${tokenAddress}`);
        console.log(`👤  Recipient: ${targetAddress}`);

        // 3. Connect & Send
        const [signer] = await ethers.getSigners();
        console.log("   Network:", (await ethers.provider.getNetwork()).name);

        try {
            const Token = await ethers.getContractAt("GemFinderToken", tokenAddress, signer);

            // Check balance first
            const bal = await Token.balanceOf(signer.address);
            console.log(`   Deployer Balance: ${ethers.formatEther(bal)} GFT`);

            if (bal < ethers.parseEther("1000")) {
                console.error("❌ Insufficient balance to send tokens.");
                return;
            }

            const amount = ethers.parseEther("10000"); // Send 10k
            console.log("   Sending 10,000 GFT...");

            const tx = await Token.transfer(targetAddress, amount);
            console.log(`   Tx Hash: ${tx.hash}`);
            console.log("   Waiting for confirmation...");
            await tx.wait();
            console.log("✅  Transfer Successful!");
        } catch (error) {
            console.error("❌ Transfer Failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
