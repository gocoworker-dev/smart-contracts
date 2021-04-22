# GOCO ERC20 token and token sales

[![Build Status](https://travis-ci.com/Gocoworker/gocoworker-tokensale-sc.svg?branch=master)](https://travis-ci.com/Gocoworker/gocoworker-tokensale-sc)

## Getting Started

### Prerequisite

Node version : 10
.env.example must be copied to .env and then edited with your information

To install and test the Gocoworker smart contracts, run the following :
```sh
npm install
npm test
```
Gocoworker smart contracts integrate with [Truffle](https://github.com/ConsenSys/truffle), an Ethereum development environment. 



## Migration on Goeli 

```sh
 ./node_modules/.bin/truffle migrate --network goerli
 node setup_sc.js
```
Token : 0x0866afA8bA5a7aE93980d0bbe57d0be9D84f6d2d
Presale: 0xCEA30aB5758cc87fa737CB03f220dF3d3eAAcb36
Sale : 0x4393F6B64A6Dc840B05898DBcB1663CfE3798bC8

## Migration on Rinkeby 

```sh
 ./node_modules/.bin/truffle migrate --network rinkeby
 node setup_sc.js
```
Token : 0x0866afA8bA5a7aE93980d0bbe57d0be9D84f6d2d
Presale: 0xCEA30aB5758cc87fa737CB03f220dF3d3eAAcb36
Sale : 0x53abE050eAbF9871dfa94DCe7B077D921A094617

## Migration on Ropsten 

```sh
 ./node_modules/.bin/truffle migrate --network ropsten
 node setup_sc.js
```
Token : 0xBE4d0b52c1b834833Fa2a8e93250Eb0dF5ABE13C
Presale: 0xC4e2b5Af3175ebF3F96BC40e025b6E032f362597
Sale : 0x53e21A7BCcda95FF53477C09492d9d0bA962080C

## Security
Gocoworker smart contracts are based on [OpenZeppelin](https://github.com/OpenZeppelin/zeppelin-solidity/) which is meant to provide secure, tested and community-audited code.

If you find a security issue, please email [griffon.sebastien@gmail.com](mailto:griffon.sebastien@gmail.com).

## AUDIT_BLOCS integration
Fixed MINOR_01


## License
Code released under the [MIT License]().
