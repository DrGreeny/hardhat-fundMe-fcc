//Get funds from users
//withdraw funds
//set a minimum funding value in USD

//SPDX-License-Identifier: MIT
//gas cost: 914259 -> 891771 constant/immutable
pragma solidity ^0.8.8;

import "./PriceConverter.sol";
import "hardhat/console.sol";
error FundMe__NotOwner(); //style guide error codes

//Interfaces, Libraries

/** @title A contract for crowd funding
 *  @author Stefan Timter
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our library
 */

contract FundMe {
    // Type declarations
    using PriceConverter for uint256;
    /**
     * Returns the latest price
     */

    //State variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner; // only set once
    AggregatorV3Interface private s_priceFeed;

    //Modifiers
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        //require(msg.sender == i_owner,"Sender is not Owner!");
        _; // function execution AFTER the require statement (could be on top, then function will be executed first
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender; //msg.sender of constructor is the one who deploys the contract!!
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /** @notice This function is to demo a sample funding contract
     *  @dev This implements price feeds as our library
     */
    function fund() public payable {
        // payable -> now you can send funds to this function
        // https://api -> not possible, as no consensus is possible on chain !!!!!!!!

        //Want to be able to set a minimum fund in USD
        //1. How do we send eth to this contract ?
        //require is a checker

        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough eth"
        ); // 1e18 = 1* 10 **18 = 1000000000000000000 (18Nullen)
        s_funders.push(msg.sender); // whoever called the fund function
        s_addressToAmountFunded[msg.sender] = msg.value;

        //Chainlink data feeds - DeFi data
        // price data of different exchanges and data providers
    }

    function withdraw() public onlyOwner {
        // require(msg.sender == owner,"Sender is not Owner!"); //as we use require, we would throw error -> do it as modifier
        console.log("withdraw called");
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0); //array with 0 objects to start
        (
            bool callSuccess, /*bytes memory dataReturned */

        ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        //mappings cant be in memory!!
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    //View/Pure
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
