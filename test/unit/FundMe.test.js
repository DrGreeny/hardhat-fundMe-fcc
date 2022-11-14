const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")

const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") //1eth = 1000000000000000000
          beforeEach(async function () {
              //deploy with hardhat
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"]) //runs through all contracts
              fundMe = await ethers.getContract("FundMe", deployer) //connects FundMe contract with deployer
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("Fails if you do not send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough eth"
                  )
              })
              it("updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("can withdraw ETH from a single founder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      `Balance contract: ${startingFundMeBalance} and starting Balance deployer: ${startingDeployerBalance}`
                  )
                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  console.log("Test")
                  const transactionReceipt = await transactionResponse.wait(1)

                  //GAS cost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  console.log(
                      `Gas used: ${gasUsed} and effectiveGasPrice: ${effectiveGasPrice}`
                  )
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  console.log(`Gas cost = ${gasCost}`)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), //this is Big Number +-Operation
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("allows us to withdraw with multiple getFunder", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      // start the loop at 1 because 0 is the deployer
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) // we want our new Accounts to be connected to the fundMe object
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  //Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), //this is Big Number +-Operation
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //Make sure getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (i = 0; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted
              })
              it("cheaperWithdraw testing", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      // start the loop at 1 because 0 is the deployer
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) // we want our new Accounts to be connected to the fundMe object
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  //Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), //this is Big Number +-Operation
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //Make sure getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (i = 0; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("can withdraw ETH from a single founder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      `Balance contract: ${startingFundMeBalance} and starting Balance deployer: ${startingDeployerBalance}`
                  )
                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  console.log("Test")
                  const transactionReceipt = await transactionResponse.wait(1)

                  //GAS cost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  console.log(
                      `Gas used: ${gasUsed} and effectiveGasPrice: ${effectiveGasPrice}`
                  )
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  console.log(`Gas cost = ${gasCost}`)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), //this is Big Number +-Operation
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
          })
      })
