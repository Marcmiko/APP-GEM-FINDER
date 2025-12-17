// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenGate
 * @dev Manages token-gated access to GemFinder premium features
 * Users pay GFT tokens to use AI analysis and advanced features
 */
contract TokenGate is Ownable, ReentrancyGuard {
    IERC20 public gftToken;
    
    // Cost in GFT tokens (with 18 decimals)
    uint256 public gemAnalysisCost = 10 * 10**18; // 10 GFT per analysis
    uint256 public advancedFilterCost = 5 * 10**18; // 5 GFT per advanced filter use
    
    // Treasury address to receive tokens
    address public treasury;
    
    // Usage tracking
    mapping(address => uint256) public userAnalysisCount;
    mapping(address => uint256) public totalTokensSpent;
    
    // Events
    event AnalysisPurchased(address indexed user, uint256 cost, uint256 timestamp);
    event FilterPurchased(address indexed user, uint256 cost, uint256 timestamp);
    event CostUpdated(string featureType, uint256 newCost);
    event TreasuryUpdated(address indexed newTreasury);
    
    /**
     * @dev Constructor
     * @param _gftToken Address of the GFT token contract
     * @param _treasury Address to receive token payments
     */
    constructor(address _gftToken, address _treasury) Ownable(msg.sender) {
        require(_gftToken != address(0), "Invalid token address");
        require(_treasury != address(0), "Invalid treasury address");
        gftToken = IERC20(_gftToken);
        treasury = _treasury;
    }
    
    /**
     * @dev Purchase a gem analysis
     * Transfers tokens from user to treasury
     */
    function purchaseGemAnalysis() external nonReentrant {
        require(gftToken.balanceOf(msg.sender) >= gemAnalysisCost, "Insufficient GFT balance");
        require(gftToken.allowance(msg.sender, address(this)) >= gemAnalysisCost, "Insufficient allowance");
        
        // Transfer tokens to treasury
        require(gftToken.transferFrom(msg.sender, treasury, gemAnalysisCost), "Transfer failed");
        
        // Update statistics
        userAnalysisCount[msg.sender]++;
        totalTokensSpent[msg.sender] += gemAnalysisCost;
        
        emit AnalysisPurchased(msg.sender, gemAnalysisCost, block.timestamp);
    }
    
    /**
     * @dev Purchase advanced filter access
     */
    function purchaseAdvancedFilter() external nonReentrant {
        require(gftToken.balanceOf(msg.sender) >= advancedFilterCost, "Insufficient GFT balance");
        require(gftToken.allowance(msg.sender, address(this)) >= advancedFilterCost, "Insufficient allowance");
        
        // Transfer tokens to treasury
        require(gftToken.transferFrom(msg.sender, treasury, advancedFilterCost), "Transfer failed");
        
        // Update statistics
        totalTokensSpent[msg.sender] += advancedFilterCost;
        
        emit FilterPurchased(msg.sender, advancedFilterCost, block.timestamp);
    }
    
    /**
     * @dev Check if user has sufficient balance for gem analysis
     */
    function canPurchaseAnalysis(address user) external view returns (bool) {
        return gftToken.balanceOf(user) >= gemAnalysisCost;
    }
    
    /**
     * @dev Check if user has sufficient balance for advanced filter
     */
    function canPurchaseFilter(address user) external view returns (bool) {
        return gftToken.balanceOf(user) >= advancedFilterCost;
    }
    
    /**
     * @dev Update gem analysis cost (owner only)
     */
    function setGemAnalysisCost(uint256 newCost) external onlyOwner {
        gemAnalysisCost = newCost;
        emit CostUpdated("gemAnalysis", newCost);
    }
    
    /**
     * @dev Update advanced filter cost (owner only)
     */
    function setAdvancedFilterCost(uint256 newCost) external onlyOwner {
        advancedFilterCost = newCost;
        emit CostUpdated("advancedFilter", newCost);
    }
    
    /**
     * @dev Update treasury address (owner only)
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }
    
    /**
     * @dev Get user statistics
     */
    function getUserStats(address user) external view returns (uint256 analysisCount, uint256 tokensSpent) {
        return (userAnalysisCount[user], totalTokensSpent[user]);
    }
}
