
const GOCOToken = artifacts.require('./GOCOToken.sol');
const GOCOPreSale = artifacts.require('./GOCOPreSale.sol');

// var openingTime = Date.parse("2019-12-13T12:00:00");
var days = 90;
var openingTime = Math.floor((new Date()).getTime() / 1000) + 120;
var closingTime = openingTime + (days*24*60*60);

module.exports = function (deployer) {
  deployer.deploy(GOCOPreSale, openingTime, closingTime, process.env.TOKENSALE_WALLET, process.env.REWARDPOOL_WALLET, GOCOToken.address);
};
