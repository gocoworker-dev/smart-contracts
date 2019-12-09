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


## Migration on Rinkeby 

```sh
 ./node_modules/.bin/truffle migrate --network rinkeby
 node setup_sc.js
```
Token : 0xCc7D5C8ad2AC270b5D7559130416911A7A59ABDB
Presale: 0x443074dA4F0b50c98BBAed64683638EF89fc1a7d
Sale : 0xEEccDAa58ecd1a55392dB369d88527641Fa3De56

## Security
Gocoworker smart contracts are based on [OpenZeppelin](https://github.com/OpenZeppelin/zeppelin-solidity/) which is meant to provide secure, tested and community-audited code.

If you find a security issue, please email [griffon.sebastien@gmail.com](mailto:griffon.sebastien@gmail.com).

## AUDIT_BLOCS integration
Fixed MINOR_01


## License
Code released under the [MIT License]().
