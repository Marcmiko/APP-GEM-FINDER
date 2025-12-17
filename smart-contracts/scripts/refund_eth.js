const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });

async function main() {
    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
        console.error("❌ No private key found");
        return;
    }

    // Connect to Ethereum Mainnet
    // Using a reliable public RPC for mainnet recovery
    const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
    const wallet = new ethers.Wallet(pk, provider);

    const recipient = "0x0eaC02BbEA586Cd72335093c5952D2E88e411FAf";

    console.log("\n🚑 RECOVERY MODE: Refund ETH on Mainnet");
    console.log("---------------------------------------");
    console.log("From: ", wallet.address);
    console.log("To:   ", recipient);

    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    if (balance === 0n) {
        console.error("❌ No funds to refund.");
        return;
    }

    try {
        // Calculate gas
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice;
        const gasLimit = 21000n; // Standard transfer
        const cost = gasLimit * gasPrice;

        console.log("Est. Gas Cost:", ethers.formatEther(cost), "ETH");

        const amountToSend = balance - cost;

        if (amountToSend <= 0n) {
            console.error("❌ Insufficient funds to cover gas fees.");
            console.log("   Need at least:", ethers.formatEther(cost), "ETH");
            return;
        }

        console.log("Refund Amount:", ethers.formatEther(amountToSend), "ETH");
        console.log("---------------------------------------");
        console.log("Sending transaction...");

        const tx = await wallet.sendTransaction({
            to: recipient,
            value: amountToSend,
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });

        console.log("✅ Transaction sent!");
        console.log("Hash:", tx.hash);
        console.log("Waiting for confirmation...");

        await tx.wait();
        console.log("🎉 Refund Confirmed!");

    } catch (error) {
        console.error("❌ Refund Failed:", error.message);
    }
}

main();
