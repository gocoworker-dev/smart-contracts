var BigNumber = require('bignumber.js');
const GOCOToken = artifacts.require('./GOCOToken.sol');
const GOCOPresale = artifacts.require('./GOCOPreSale.sol');
const GOCOSale = artifacts.require('./GOCOSale.sol');


const PRESALE_TOKEN_SUPPLY = new BigNumber(2100000).multipliedBy(new BigNumber(10).pow(new BigNumber(18)));
const SALE_TOKEN_SUPPLY = new BigNumber(10500000).multipliedBy(new BigNumber(10).pow(new BigNumber(18)));

module.exports = function (deployer, network) {
  if (network == "testrpc") {
    deployer.then(function() {
      return GOCOToken.deployed()
    }).then(function(instance) {
      token = instance;
      return token.transfer(GOCOPresale.address, PRESALE_TOKEN_SUPPLY.div(new BigNumber(10)), { from: process.env.REWARDPOOL_WALLET, gas: 210000 });// approve the presale contract to transfer reward pool tokens
    }).then(function (resultvar){
      console.log("Reward Pool wallet approved Presale contract")
      return token.transfer(GOCOPresale.address, PRESALE_TOKEN_SUPPLY, { from:  process.env.TOKENSALE_WALLET, gas: 210000 });    
    }).then (function (result) {
      console.log("Token sale wallet transfered tokens to Presale contract")
      return token.transfer(GOCOSale.address, SALE_TOKEN_SUPPLY, { from: process.env.TOKENSALE_WALLET, gas: 210000 });// approve the sale contract to transfer tokensale wallet tokens  
    }).then (function (result){
      console.log("Token sale wallet transfered Sale contract")
    });
  }
};
