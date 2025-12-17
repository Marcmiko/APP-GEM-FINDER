// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenSale
 * @dev A simple crowdsale contract for GemFinder Token (GFT)
 * Users can buy GFT with ETH
 */
contract TokenSale is Ownable, ReentrancyGuard {
    IERC20 public token;
    uint256 public rate; // How many token units a buyer gets per wei
    
    event TokensPurchased(address indexed purchaser, uint256 ethAmount, uint256 tokenAmount);
    event RateUpdated(uint256 newRate);
    event EthWithdrawn(address indexed to, uint256 amount);

    /**
     * @param _token Address of the token being sold
     * @param _rate Number of token units a buyer gets per wei
     * Example: If rate = 1000, 1 ETH (10^18 wei) buys 1000 GFT (1000 * 10^18)
     */
    constructor(IERC20 _token, uint256 _rate) Ownable(msg.sender) {
        require(address(_token) != address(0), "Token address cannot be 0");
        require(_rate > 0, "Rate must be > 0");
        
        token = _token;
        rate = _rate;
    }

    receive() external payable {
        buyTokens();
    }

    function buyTokens() public payable nonReentrant {
        uint256 weiAmount = msg.value;
        require(weiAmount > 0, "Must send ETH");

        // Calculate token amount to be created
        uint256 tokens = weiAmount * rate;
        
        // Check if contract has enough tokens
        require(token.balanceOf(address(this)) >= tokens, "Insufficient tokens in sale contract");

        // Transfer tokens to beneficiary
        require(token.transfer(msg.sender, tokens), "Token transfer failed");

        emit TokensPurchased(msg.sender, weiAmount, tokens);
    }
    
    /**
     * @dev Set new exchange rate
     */
    function setRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Rate must be > 0");
        rate = _newRate;
        emit RateUpdated(_newRate);
    }

    /**
     * @dev Withdraw ETH from the contract
     */
    function withdrawEth() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH transfer failed");
        
        emit EthWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Recover unsold tokens
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(token.transfer(owner(), amount), "Token transfer failed");
    }
}
