const hre = require("hardhat");
const { ethers } = hre;

// Helper to wait for code indexing
async function waitForCode(address, name) {
    console.log(`⏳ Waiting for ${name} code to be indexed at ${address}...`);
    let code = await ethers.provider.getCode(address);
    let retries = 0;
    while (code === "0x" && retries < 20) {
        await new Promise(r => setTimeout(r, 3000));
        code = await ethers.provider.getCode(address);
        process.stdout.write("."); // Simple loading indicator
        retries++;
    }
    console.log(""); // Newline
    if (code === "0x") {
        console.error(`❌ ${name} code NOT found after waiting.`);
        throw new Error("Contract deployment verification failed (RPC latency).");
    } else {
        console.log(`✅ ${name} code verified.`);
    }
}

async function main() {
    console.log("🚀 Starting GemFinder Token deployment (Resilient Mode)...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

    // 1. Deploy GemFinderToken
    console.log("🪙 Deploying GemFinderToken...");
    const GemFinderToken = await ethers.getContractFactory("GemFinderToken");
    const gftToken = await GemFinderToken.deploy();
    await gftToken.waitForDeployment(); // Standard wait
    const gftAddress = await gftToken.getAddress();
    console.log("✅ GemFinderToken deployed to:", gftAddress);

    // Explicit wait for code
    await waitForCode(gftAddress, "GemFinderToken");

    console.log(`   Name: ${await gftToken.name()}`);
    console.log(`   Symbol: ${await gftToken.symbol()}`);
    console.log(`   Total Supply: ${ethers.formatEther(await gftToken.totalSupply())} GFT\n`);

    // 2. Deploy TokenGate
    console.log("🔐 Deploying TokenGate...");
    const TokenGate = await ethers.getContractFactory("TokenGate");
    const tokenGate = await TokenGate.deploy(gftAddress, deployer.address);
    await tokenGate.waitForDeployment();
    const tokenGateAddress = await tokenGate.getAddress();
    console.log("✅ TokenGate deployed to:", tokenGateAddress);

    await waitForCode(tokenGateAddress, "TokenGate");

    console.log(`   Analysis Cost: ${ethers.formatEther(await tokenGate.gemAnalysisCost())} GFT`);
    console.log(`   Filter Cost: ${ethers.formatEther(await tokenGate.advancedFilterCost())} GFT\n`);

    // 3. Deploy TokenSale
    const RATE = 100000;
    console.log("💰 Deploying TokenSale...");
    const TokenSale = await ethers.getContractFactory("TokenSale");
    const tokenSale = await TokenSale.deploy(gftAddress, RATE);
    await tokenSale.waitForDeployment();
    const tokenSaleAddress = await tokenSale.getAddress();
    console.log("✅ TokenSale deployed to:", tokenSaleAddress);

    await waitForCode(tokenSaleAddress, "TokenSale");

    // Distribution
    console.log("\n📦 Distributing Tokens...");
    const SALE_ALLOCATION = ethers.parseEther("400000000"); // 40%
    // const AIRDROP_ALLOCATION = ethers.parseEther("400000000"); 

    console.log("   Transferring 40% (400M GFT) to TokenSale contract...");
    const tx = await gftToken.transfer(tokenSaleAddress, SALE_ALLOCATION);
    await tx.wait();
    console.log("   ✅ Transfer complete");

    // Send tokens to user as requested
    const USER_ADDRESS = "0x0eaC02BbEA586Cd72335093c5952D2E88e411FAf";
    console.log("\n🎁 Fulfilling User Request...");
    const USER_AMOUNT = ethers.parseEther("10000"); // 10k GFT
    console.log(`   Sending 10,000 GFT to ${USER_ADDRESS}...`);
    try {
        const userTx = await gftToken.transfer(USER_ADDRESS, USER_AMOUNT);
        await userTx.wait();
        console.log("   ✅ User tokens sent!");
    } catch (e) {
        console.error("   ❌ Failed to send user tokens:", e.message);
    }

    console.log("\n📋 Deployment Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("GemFinderToken:", gftAddress);
    console.log("TokenGate:     ", tokenGateAddress);
    console.log("TokenSale:     ", tokenSaleAddress);
    console.log("Treasury:      ", deployer.address);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
