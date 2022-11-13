//Get funds from users
//withdraw funds
//set a minimum funding value in USD

//SPDX-License-Identifier: MIT
//gas cost: 914259 -> 891771 constant/immutable
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

error NotOwner();

contract FundMe {
    using PriceConverter for uint256;
    /**
     * Returns the latest price
     */

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    address public immutable i_owner; // only set once
    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender; //msg.sender of constructor is the one who deploys the contract!!
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        // payable -> now you can send funds to this function
        // https://api -> not possible, as no consensus is possible on chain !!!!!!!!

        //Want to be able to set a minimum fund in USD
        //1. How do we send eth to this contract ?
        //require is a checker

        require(
            msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
            "Didn't send enough eth"
        ); // 1e18 = 1* 10 **18 = 1000000000000000000 (18Nullen)
        funders.push(msg.sender); // whoever called the fund function
        addressToAmountFunded[msg.sender] = msg.value;

        //Chainlink data feeds - DeFi data
        // price data of different exchanges and data providers
    }

    function withdraw() public onlyOwner {
        // require(msg.sender == owner,"Sender is not Owner!"); //as we use require, we would throw error -> do it as modifier
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex = funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }
        funders = new address[](0); //array with 0 objects to start
        (
            bool callSuccess, /*bytes memory dataReturned */

        ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert NotOwner();
        }
        //require(msg.sender == i_owner,"Sender is not Owner!");
        _; // function execution AFTER the require statement (could be on top, then function will be executed first
    }

    //What happens if someones sends this contract eth without calling fund() function

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
