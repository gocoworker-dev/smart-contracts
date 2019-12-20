# GOCOWORKER smart contracts audit

*Public version, 2019-12-20*

## 1. Introduction

### 1.1. Legal disclaimer

The information appearing in this audit is for general discussion purposes only and is not intended to provide legal security guarantees to any individual or entity.

### 1.2. Audit information

+ **Project name:** GOCOWORKER smart contracts
+ **Project commit hash:** f99ea6616da12882a3eb28c7f2c0cac4567a0ac8
+ **Project repository:** private repository at the time of this audit
+ **Project specifications:** private document at the time of this audit
+ **Auditor:** [Guillaume Duveau](https://guillaumeduveau.com/en/)
+ **Audit date:** 2019-12-20
+ **Audit document:** this document
+ **Audit document version:** public version

A private audit version was provided earlier to the team in December, based on the commit hash 45116d2749220227792440a9d831f7010d604d51. This public audit version is based on the commit hash f99ea6616da12882a3eb28c7f2c0cac4567a0ac8, after the team made all necessary modifications.

## 2. Project documentation

### 2.1 Installation

Installation instructions in README.md are clear.

The reference Node.js version is specified.

*The package-lock.json is outdated but it's normal since the last package.json modification was made 7 days before this audit.*

### Truffle tests

README.md gives clear instructions on how to run the Truffle tests.

The process is simple.

## 3. Project architecture overview

The project aims to deploy an ERC-20 Ethereum token, a presale of this token and a sale of this token.

### 3.1. Smart contracts

There are 3 smart contracts:
+ GOCOToken.sol defines the token (name: GOCOWORKER, symbol: GOCO, decimals: 18)
+ GOCOPresale.sol defines the presale
+ GOCOSale.sol defines the sale

They are meant to be deployed manually in this order and not necessarily at the same time.

Those smart contracts contracts inherit from:
+ openzeppelin-solidity 2.4.0 smart contracts
+ in file custom smart contracts

### 3.2. Ethereum External owned accounts (EOA)

There are 4 EOAs involved:
+ the EOA which deploys the contracts (let's call it DEPLOYER_WALLET)
+ TEAM_WALLET is the EOA storing the team's reserve of GOCO tokens
+ TOKENSALE_WALLET is the EOA storing the supply of GOCO tokens for the token presale and the token sale
+ REWARDPOOL_WALLET is the EOA storing the supply of GOCO tokens to reward REFERRERS and REFEREES when REFEREES buy GOCO tokens, and to reward GOCOWORKER stakeholders in the future

## 4. Deployment

### 4.1. Step 1: deployment of GOCOToken.sol

In step 1, GOCO token is deployed by DEPLOYER_WALLET, taking in parameters:
````
address teamWallet => TEAM_WALLET
address tokenSaleWallet => TOKENSALE_WALLET
address rewardPoolWallet => REWARDPOOL_WALLET
````

The amounts of token are the following:
````
uint256 public constant TEAM_SUPPLY = 7000000
uint256 public constant TOKEN_SALE_SUPPLY = 12600000
uint256 public constant REWARD_POOL_SUPPLY = 1400000
````

Verification:
````
7 000 000 + 12 600 000 + 1 400 000 = 21 000 000 tokens in total.
````

The global token amount is fixed at 21 million tokens and definitive (there is no way to create new tokens afterwards).

### 4.2 Step 2: deployment of GOCOPreSale.sol

Deploying the presale requires the token to be already deployed. The constructor takes those parameters:
````
uint256 openingTime => when the presale opens
uint256 closingTime => when the presale closes
address payable saleWallet => the EOA holding the tokens to transfer to the presale (and the sale in step 3)
address rewardPoolWallet => the EOA holding the tokens to reward referrals, and the beneficiary of the presale remaining tokens when it is finalized
IERC20 gocotoken => interface with the deployed token
````

The parameters of the inherited contracts contructors are hardcoded in the constructor, in particular:
````
uint256 rate => 10
uint256 cap => 210 000 ether
````

The price of 1 token is fixed during the presale at 0.1 Eth.

Verification of the token price:
````
1 wei => 10 units of smallest quantity = 10^-18 = 10^-17 token units
so 1 Ether => 10^18 * 10^-17 = 10 tokens
so 0,1 Ether = 1 token
=> OK
````

Verification of the presale cap:
````
210 000 ether => 2 100 000 directly purchasable tokens without referrals
SALE_WALLET holds 12 600 000 tokens > 2 100 000
=> 2 100 000 tokens can be transfered to GCWPresale.sol
=> OK
````

Verification of the rewardPoolWallet expenses approval:
````
In the most extreme case, only 1 token is bought without referrals with 0,1 Eth.
The remaining 2 099 999 tokens are all bought with referrals which means 5 + 5 = 10 % of 2 099 999 tokens = 209 999.9 tokens must be rewarded
REWARDPOOL_WALLET holds 1 400 000 tokens
REWARDPOOL_WALLET has approved GCWPreSale.sol to spend 10 % of 2 100 000 tokens = 210 000 tokens
209 999.9 < 210 000
209 999.9 < 1 400 000
=> OK
````

### 4.3. Step 3: deployment of GOCOSale.sol

Parameters:
````
uint256 openingTime => when the sale opens
address payable wallet => the GOCOWORKER EOA the funds are transfered to after each token purchase
address rewardpool => the reward pool EOA
uint256 numberOfPeriod => the number of periods of the sale
ERC20Detailed token => the token
````

Hardcoded:
````
_tokenCap = 10 500 000
````

Verification :
````
We need to transfer 10 500 000 tokens from the SALE_WALLET to the sale contract
SALE_WALLET had 12 600 000 tokens in total
2 100 000 were transfered to GCWPreSale, remains : 12 600 000 – 2 100 000 = 10 500 000
SALE_WALLET can transfer 10 500 000 tokens
=> OK
````

## 5. Best practices

[Consensys best practices recommendations](https://consensys.github.io/smart-contract-best-practices/recommendations/) are very well followed.

For instance:
+ functions and state variables visibility are explicit
+ pragmas are locked to a specific compiler version (`pragma solidity 0.5.13;`)

Error messages are set on almost all require(). Missing ones:
+ GOCOPreSale => 1 in `modifier onlyWhileOpen`
+ GOCOSALE => 2 in `function finalize()`

## 6. Istanbul fork

The new release of Ethereum came on December 8 with the Istanbul fork.

### 6.1. Inherited Openzeppelin contracts

The version of the Openzeppelin contracts (openzeppelin-solidity), on which GOCOWORKER's contracts heavily depend, is the release 2.4.0 which is compatible with the Istanbul fork. In particular, Solidity's transfer() is now considered harmful and in the future, smart contracts that use it will be irreversibly broken. Openzeppelin has a sendValue() in replacement in the 2.4.0 release.

### 6.2. Custom code

In the GOCOWORKER's contracts, Solidity's transfer() is avoided. Openzeppelin's sendValue() is used instead.

GOCOWORKER's contracts are compatible with the Istanbul fork.

## 7. Security

We took [Consensys known attacks](https://consensys.github.io/smart-contract-best-practices/known_attacks/) as the reference.

### 7.1 Reentrancy

In GOCOSale, claim(), claimAll() and batchClaim() are protected by the nonReentrant modifier which is Openzeppelin's own implementation of a mutex. They have the external visibility which is good to avoid loops that could be generated by code.

buyTokens() is still public. It's the same on Openzeppelin's Crowdsale.sol. The reason is to allow the contract to call himself this function when receiving Ether without any function call:
````
function () external payable {
    buyTokens(msg.sender);
}
````

### 7.2. Front-running

The Presale and the Sale do not seem to be vulnerable to transaction ordering exploits.

### 7.3 Timestamp

Those contracts use timestamp and the potential consequences of its manipulation have been explained to the team who took the necessary measures.

### 7.4. Integer overflow and underflow

All the operations are protected by SafeMath.

### 7.5. DoS with (unexpected) revert

The only function that could be sensible is batchClaim() which loops on an infinite array of user addresses, but no serious consequences can be forseen. Still, we do not really see why it's not onlyOwner.

### 7.6 DoS with block gas limit

claimAll() and batchClaim() could reach the block gas limit (same remark than above for batchClaim()). No serious consequences can be forseen.

### 7.7 Insufficient gas griefing

There is no multisig in the code neither relays, so the contracts should be safe from those attacks.

### 7.8. Forcibly sending ether to a contract

The fallback function in GOCOSale.sol buys tokens which is not dangerous, so there does not seem to be any vulnerability to this.

## 8. Conclusion

The GOCOWORKER contracts seem to be production-ready.
