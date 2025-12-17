const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🚀 Starting GemFinder Token deployment...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

    // Deploy GemFinderToken
    console.log("🪙 Deploying GemFinderToken...");
    const GemFinderToken = await ethers.getContractFactory("GemFinderToken");
    const gftToken = await GemFinderToken.deploy();
    await gftToken.waitForDeployment();
    const gftAddress = await gftToken.getAddress();
    console.log("✅ GemFinderToken deployed to:", gftAddress);

    // Get token details
    const name = await gftToken.name();
    const symbol = await gftToken.symbol();
    const totalSupply = await gftToken.totalSupply();
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} GFT\n`);

    // Deploy TokenGate
    console.log("🔐 Deploying TokenGate...");
    const TokenGate = await ethers.getContractFactory("TokenGate");
    const tokenGate = await TokenGate.deploy(gftAddress, deployer.address);
    await tokenGate.waitForDeployment();
    const tokenGateAddress = await tokenGate.getAddress();
    console.log("✅ TokenGate deployed to:", tokenGateAddress);

    // Get TokenGate details
    const analysisCost = await tokenGate.gemAnalysisCost();
    const filterCost = await tokenGate.advancedFilterCost();
    console.log(`   Gem Analysis Cost: ${ethers.formatEther(analysisCost)} GFT`);
    console.log(`   Advanced Filter Cost: ${ethers.formatEther(filterCost)} GFT\n`);

    // Deploy TokenSale
    // Rate: 1 ETH = 100,000 GFT (Example rate: 0.00001 ETH per GFT)
    const RATE = 100000;
    console.log("💰 Deploying TokenSale...");
    console.log(`   Rate: 1 ETH = ${RATE} GFT`);
    const TokenSale = await ethers.getContractFactory("TokenSale");
    const tokenSale = await TokenSale.deploy(gftAddress, RATE);
    await tokenSale.waitForDeployment();
    const tokenSaleAddress = await tokenSale.getAddress();
    console.log("✅ TokenSale deployed to:", tokenSaleAddress);

    // Distribution
    console.log("\n📦 Distributing Tokens...");
    const SALE_ALLOCATION = ethers.parseEther("400000000"); // 40% (400M)
    // const AIRDROP_ALLOCATION = ethers.parseEther("400000000"); // 40% (400M) - Kept in owner wallet for now
    // const TEAM_ALLOCATION = ethers.parseEther("200000000"); // 20% (200M) - Kept in owner wallet for now

    console.log("   Transferring 40% (400M GFT) to TokenSale contract...");
    await gftToken.transfer(tokenSaleAddress, SALE_ALLOCATION);
    console.log("   ✅ Transfer complete");

    console.log("\n📋 Deployment Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("GemFinderToken:", gftAddress);
    console.log("TokenGate:     ", tokenGateAddress);
    console.log("TokenSale:     ", tokenSaleAddress);
    console.log("Treasury:      ", deployer.address);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Distribution:");
    console.log(" - Sale (40%):    400,000,000 GFT (In TokenSale contract)");
    console.log(" - Airdrop (40%): 400,000,000 GFT (In Deployer wallet)");
    console.log(" - Team (20%):    200,000,000 GFT (In Deployer wallet)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("⏳ Waiting for block confirmations before verification...");
    await gftToken.deploymentTransaction()?.wait(5);
    await tokenGate.deploymentTransaction()?.wait(5);
    await tokenSale.deploymentTransaction()?.wait(5);

    console.log("\n📝 To verify contracts on BaseScan, run:");
    console.log(`npx hardhat verify --network baseSepolia ${gftAddress}`);
    console.log(`npx hardhat verify --network baseSepolia ${tokenGateAddress} ${gftAddress} ${deployer.address}`);
    console.log(`npx hardhat verify --network baseSepolia ${tokenSaleAddress} ${gftAddress} ${RATE}`);

    console.log("\n✨ Deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
