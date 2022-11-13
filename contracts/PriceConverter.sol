//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        // ABI
        // Address 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        (, int256 price, , , ) = priceFeed.latestRoundData();
        //ETH in terms of USD
        // 3000.00000000 -> 8 decimal places associated to this price feed
        return uint256(price * 1e10); //1**10 == 10000000000
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        // eth price 3000$ ->3000.000000000000000000 ist ETH/USD price feed
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        // 3000
        return ethAmountInUsd;
    }
}
