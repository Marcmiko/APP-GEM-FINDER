const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

function main() {
    console.log("🔐 Generating new Deployment Wallet...");

    // Generate random wallet
    const wallet = ethers.Wallet.createRandom();
    const pk = wallet.privateKey;
    const address = wallet.address;

    console.log("-----------------------------------------");
    console.log("✅ New Wallet Created!");
    console.log("Address:    ", address);
    console.log("Private Key:", pk);
    console.log("-----------------------------------------");

    // Check existing .env
    const envPath = path.join(__dirname, "../.env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
    }

    if (envContent.includes("PRIVATE_KEY=")) {
        console.log("⚠️  PRIVATE_KEY already exists in smart-contracts/.env. Skipping append.");
    } else {
        const newContent = envContent + `\nPRIVATE_KEY=${pk}\n`;
        fs.writeFileSync(envPath, newContent);
        console.log("💾 Saved PRIVATE_KEY to smart-contracts/.env");
    }

    // Also try root .env
    const rootEnvPath = path.join(__dirname, "../../.env");
    if (fs.existsSync(rootEnvPath)) {
        let rootContent = fs.readFileSync(rootEnvPath, "utf8");
        if (!rootContent.includes("PRIVATE_KEY=")) {
            fs.writeFileSync(rootEnvPath, rootContent + `\nPRIVATE_KEY=${pk}\n`);
            console.log("💾 Saved PRIVATE_KEY to root .env");
        }
    }

    console.log("\n🚀 NEXT STEPS:");
    console.log("1. Send ETH to this address: " + address);
    console.log("2. Run deployment: npx hardhat run scripts/deploy.js --network base");
}

main();
