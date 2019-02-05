
var GCWToken = artifacts.require("./GCWToken.sol");
var GCWPreSale = artifacts.require("./GCWPreSale.sol");


//var openingTime = Date.parse("09/30/2019 12:00:00");

module.exports = function(deployer) {
  deployer.deploy(GCWPreSale, Date.now(), process.env.TOKENSALE_WALLET, process.env.REWARDPOOL_WALLET, GCWToken.address);
};