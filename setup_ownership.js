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


var provider = new HDWalletProvider(process.env.MNEMONIC, 'https://goerli.infura.io/' + process.env.INFURA_API_KEY, 0, 5)

GOCOToken.setProvider(provider);
GOCOToken.setNetwork(3)

GOCOPresale.setProvider(provider);
GOCOPresale.setNetwork(3)

GOCOSale.setProvider(provider);
GOCOSale.setNetwork(3)

var token;
GOCOPresale.deployed().then(async function(instance) {
  await instance.addPauser('0xd15eae6017e6ab1bd3c0eb9838c1c7d7a9a02139', { from: '0x59d983A2Dc98D8219dE0B0B2De13680061E36386', gas: 210000 });
  await instance.renouncePauser({ from: '0x59d983A2Dc98D8219dE0B0B2De13680061E36386', gas: 210000 })
  return instance.transferOwnership('0xd15eae6017e6ab1bd3c0eb9838c1c7d7a9a02139', { from: '0x59d983A2Dc98D8219dE0B0B2De13680061E36386', gas: 210000 }).then(function (result){instance.})
}).then (function (result){
  console.log("GOCOPresale ownership transfered")
  return GOCOSale.deployed()
}).then (async function (instance) {
  await instance.addPauser('0xd15eae6017e6ab1bd3c0eb9838c1c7d7a9a02139', { from: '0x59d983A2Dc98D8219dE0B0B2De13680061E36386', gas: 210000 });
  await instance.renouncePauser({ from: '0x59d983A2Dc98D8219dE0B0B2De13680061E36386', gas: 210000 })
  return instance.transferOwnership('0xd15eae6017e6ab1bd3c0eb9838c1c7d7a9a02139', { from: '0x59d983A2Dc98D8219dE0B0B2De13680061E36386', gas: 210000 })
}).then (function (result){
  console.log("GOCOSale ownership transfered")
})
