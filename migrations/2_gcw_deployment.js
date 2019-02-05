var GCWToken = artifacts.require("./GCWToken.sol");

module.exports = function(deployer) {
  deployer.deploy(GCWToken, process.env.FOUNDER_WALLET, process.env.TOKENSALE_WALLET, process.env.REWARDPOOL_WALLET);
};