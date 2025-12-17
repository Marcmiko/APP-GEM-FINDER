const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });
require("dotenv").config({ path: "../../.env" });

async function main() {
    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
        console.error("No private key found");
        return;
    }
    const wallet = new ethers.Wallet(pk);
    console.log("Checking ETH Mainnet balance for:", wallet.address);

    // Use a public RPC for Mainnet
    const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
    const balance = await provider.getBalance(wallet.address);

    console.log("ETH Mainnet Balance:", ethers.formatEther(balance), "ETH");

    if (balance > 0n) {
        console.log("⚠️  Funds found on Ethereum Mainnet!");
    } else {
        console.log("❌ No funds on Ethereum Mainnet either.");
    }
}

main();
