require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');
var BigNumber = require('bignumber.js');
var token = require("./build/contracts/GOCOToken.json");
var presale = require("./build/contracts/GOCOPreSale.json");
var sale = require("./build/contracts/GOCOSale.json");

var contract = require("truffle-contract");
var GOCOToken = contract(token);
var GOCOPresale = contract(presale);
var GOCOSale = contract(sale);

const PRESALE_TOKEN_SUPPLY = new BigNumber(2100000).multipliedBy(new BigNumber(10).pow(new BigNumber(18)));
const SALE_TOKEN_SUPPLY = new BigNumber(10500000).multipliedBy(new BigNumber(10).pow(new BigNumber(18)));


var provider = new HDWalletProvider(process.env.MNEMONIC, 'https://ropsten.infura.io/' + process.env.INFURA_API_KEY, 0, 5)

GOCOToken.setProvider(provider);
GOCOToken.setNetwork(3)

GOCOPresale.setProvider(provider);
GOCOPresale.setNetwork(3)

GOCOSale.setProvider(provider);
GOCOSale.setNetwork(3)

var token;
GOCOToken.deployed().then(function(instance) {
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


