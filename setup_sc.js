require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');
var BigNumber = require('bignumber.js');
var token = require("./build/contracts/GCWToken.json");
var presale = require("./build/contracts/GCWPreSale.json");
var sale = require("./build/contracts/GCWSale.json");

var contract = require("truffle-contract");
var GCWToken = contract(token);
var GCWPresale = contract(presale);
var GCWSale = contract(sale);

const PRESALE_TOKEN_SUPPLY = new BigNumber(2100000).mul(new BigNumber(10).pow(new BigNumber(18)));
const SALE_TOKEN_SUPPLY = new BigNumber(10500000).mul(new BigNumber(10).pow(new BigNumber(18)));


var provider = new HDWalletProvider(process.env.MNEMONIC, 'https://rinkeby.infura.io/' + process.env.INFURA_API_KEY, 0, 5)


GCWToken.setProvider(provider);
GCWToken.setNetwork(4)

GCWPresale.setProvider(provider);
GCWPresale.setNetwork(4)

GCWSale.setProvider(provider);
GCWSale.setNetwork(4)

var token;
GCWToken.deployed().then(function(instance) {
  token = instance;
  return token.approve(GCWPresale.address, PRESALE_TOKEN_SUPPLY.div(new BigNumber(10)), { from: process.env.REWARDPOOL_WALLET, gas: 210000 });// approve the presale contract to transfer reward pool tokens
}).then(function (resultvar){
  console.log("Reward Pool wallet approved Presale contract")
  return token.transfer(GCWPresale.address, PRESALE_TOKEN_SUPPLY, { from:  process.env.TOKENSALE_WALLET });    
}).then (function (result) {
  console.log("Token sale wallet transfered tokens to Presale contract")
  return token.approve(GCWSale.address, SALE_TOKEN_SUPPLY, { from: process.env.TOKENSALE_WALLET, gas: 210000 });// approve the sale contract to transfer tokensale wallet tokens  
}).then (function (result){
  console.log("Token sale wallet approved Sale contract")
});


