
const GCWToken = artifacts.require('./GCWToken.sol');
const GCWPreSale = artifacts.require('./GCWPreSale.sol');

// var openingTime = Date.parse("09/30/2019 12:00:00");
var days = 90;
var openingTime = Math.floor((new Date()).getTime() / 1000) + 120;
var closingTime = openingTime + (days*24*60*60);

module.exports = function (deployer) {
  deployer.deploy(GCWPreSale, openingTime, closingTime, process.env.TOKENSALE_WALLET, process.env.REWARDPOOL_WALLET, GCWToken.address);
};
