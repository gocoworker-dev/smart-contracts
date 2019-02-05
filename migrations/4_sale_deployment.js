var GCWToken = artifacts.require("./GCWToken.sol");
var GCWSale = artifacts.require("./GCWSale.sol");

//var openingTime = Date.parse("09/30/2019 12:00:00");

module.exports = function(deployer) {
  deployer.deploy(GCWSale,  Date.now(), process.env.TOKENSALE_WALLET,  process.env.REWARDPOOL_WALLET, 250 /*nb period*/, 42000 /*nb tken by period*/,GCWToken.address);
};