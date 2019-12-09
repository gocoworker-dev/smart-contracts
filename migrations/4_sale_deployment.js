const GOCOToken = artifacts.require('./GOCOToken.sol');
const GOCOSale = artifacts.require('./GOCOSale.sol');


var openingTime = Math.floor((new Date()).getTime() / 1000) + 120;
//var openingTime = Date.parse("2019-12-13T15:00:00");

module.exports = function (deployer) {
  deployer.deploy(GOCOSale, openingTime, process.env.TOKENSALE_WALLET, process.env.REWARDPOOL_WALLET, 250 /* nb period */, GOCOToken.address);
};
