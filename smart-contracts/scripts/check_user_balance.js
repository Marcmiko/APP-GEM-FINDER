const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config({ path: "../.env" });

async function main() {
    const userAddress = "0x0eaC02BbEA586Cd72335093c5952D2E88e411FAf";
    const tokenAddress = "0x55d34f6e95aE41a5B61064684bdD5EFAE0e4b6d0";

    console.log("🔍 Checking GFT Balance...");
    console.log("   Token Contract:", tokenAddress);
    console.log("   User Address:  ", userAddress);

    const provider = ethers.provider;

    // Check if code exists (sanity check)
    const code = await provider.getCode(tokenAddress);
    if (code === "0x") {
        console.error("❌ ERROR: No contract found at deployment address!");
        return;
    }

    // Connect to token
    const abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
    ];
    const contract = new ethers.Contract(tokenAddress, abi, provider);

    try {
        const symbol = await contract.symbol();
        const balance = await contract.balanceOf(userAddress);

        console.log("\n✅ Query Successful:");
        console.log(`   Balance: ${ethers.formatEther(balance)} ${symbol}`);

        if (balance > 0n) {
            console.log("   👉 The tokens are DEFINITELY in the wallet.");
        } else {
            console.log("   ⚠️  Balance is ZERO. Transfer might have failed.");
        }
    } catch (e) {
        console.error("❌ Query Failed:", e.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
