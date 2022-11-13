//imports

const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
//main function

//calling main function

/* function deployFunc(hre) {
    console.log("Hi")
    hre.getNamedACcounts()
    hre.deployments
}

module.exports.default = deployFunc
 */

/* module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre

} */

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainID = network.config.chainId

    //flip between local and testnet chain
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        console.log("testnet used")
        ethUsdPriceFeedAddress = networkConfig[chainID]["ethUsdPriceFeed"]
    }
    //if the contract doesnt exist, we deploy a minimal version of for our local testing

    //Price feeds from chainlink locally not available
    //well what when we want to change chains
    //when going for localhost or hardhat betwork we want to use a mock
    console.log(ethUsdPriceFeedAddress)
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], // put price Feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("-------------------------------------------------------------")
}

module.exports.tags = ["all", "FundMe"]
