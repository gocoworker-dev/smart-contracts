const GOCOToken = artifacts.require('./GOCOToken.sol');
const GOCOSale = artifacts.require('./GOCOSale.sol');


//var openingTime = Math.floor((new Date()).getTime() / 1000) + 120;
//var nbPeriod = 250;


var openingTime = Math.floor(Date.parse("2021-09-01T12:00:00Z") / 1000);
var nbPeriod = 25;


module.exports = function (deployer) {
  deployer.deploy(GOCOSale, openingTime, process.env.TOKENSALE_WALLET, process.env.REWARDPOOL_WALLET, nbPeriod, GOCOToken.address);
};
