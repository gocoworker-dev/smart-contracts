const GCWToken = artifacts.require('./GCWToken.sol');
const GCWSale = artifacts.require('./GCWSale.sol');


var openingTime = Math.floor((new Date()).getTime() / 1000) + 120;
// var openingTime = Date.parse("09/30/2019 12:00:00");

module.exports = function (deployer) {
  deployer.deploy(GCWSale, openingTime, process.env.TOKENSALE_WALLET, process.env.REWARDPOOL_WALLET, 250 /* nb period */, GCWToken.address);
};
