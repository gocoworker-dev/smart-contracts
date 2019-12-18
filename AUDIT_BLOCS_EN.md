# Audit report of GOCO Presale, Sale and Token smart contracts
#### _Edited on December 2019, by [Jonathan "Blocs" Serra](https://blocs.fr/)_

**All issues has been fixed and reviewed by the team, there is no raised threat or security issues on the last version of the contracts.**

# Introduction

This report is about the three following contracts :
- [GOCOToken](contracts/GOCOToken.sol) : GOCO Token ;
- [GOCOPreSale](contracts/GOCOPreSale.sol) : GOCO Presale ;
- [GOCOSale](contracts/GOCOSale.sol) : GOCO Sale with periods of 21 hours ;

All potential vulnerabilities and good code practices are noticed by 3 tags as commentaries written in the contracts source code and all related tests :
- `MAJOR_x` where x is a 2 digits number : This references all parts that have impact in contracts logics ;
- `MEDIUM_x` where x is a 2 digits number : This references all parts where particular care is required ;
- `MINOR_x` where x is a 2 digits number: This references all parts that can be enhanced for security or code readability ;
- `WATCH_x` where x is a 2 digits number: This references all parts when something is unsure about business logic ;

All symbols are related to the state of the issue :
- :white_large_square: : Means this has not been done or fixed ;
- :white_check_mark: : Means this has been done or fixed ;
- :ok_hand: : Means this has been reviewed and possibly changed accordingly, the issue is considered to not be a threat ;
- :heavy_minus_sign: : Means the issue has been deleted ;

During the audit some unit tests have been written. Those are included in the related source code.

All tests have been executed in development environment using Ganache with blocks mining.

Some attacks vector where tested with `truffle console`.

The entire code except `Migrations.sol` and all OpenZeppelin contracts have been shrewdly reviewed.

In the document critical parts are indexed with the tag **CRITICAL**.

# Summary

1. [Prelude](#1)
2. [Overview](#2)
3. [Attacks verified](#3)
4. [Contract abuse](#4)
5. [Major](#5)
6. [Medium](#6)
7. [Minor](#7)
8. [Watch](#8)
9. [Solidity and OpenZeppelin version](#9)
9. [Conclusion](#10)

# 1. <a name="1"></a>Prelude

This audit is not about viability of the business around contracts. Only source code quality and security is audited. This audit is delivered with the following :
- A report ;
- Source code commented with references ;
- Updates on unit tests ;

# 2. <a name="2"></a>Overview

The contracts purpose is to sell GOCO (ERC20) Tokens, all integrated with [OpenZeppelin Solidity](https://github.com/OpenZeppelin/openzeppelin-contracts). The sale is splitted into 2 steps and one token.

#### _Token_

Token ERC20 GOCO.

Constructor :
- `teamWallet` : founder wallet to receive 7,000,000 GOCO ;
- `tokenSaleWallet` : sale and presale to receive 12,600,000 GOCO ;
- `rewardPoolWallet` : reward wallet to receive 1,400,000 GOCO ;

All tokens are minted on deployment for a total of 21,000,000 GOCO which is the **total supply**, `_mint` being internal.

#### _Presale_

Limited quantity sale of GOCO Tokens. The Presale is followed with a referral program allowing referees and investors to receive Tokens as reward.

Constructor :
- `openingTime` : timestamp for opening time ;
- `closingTime` : timestamp for closing time ;

Presale requires to have GOCO Tokens in reserve in order to operate.

#### _Sale_

Limited quantity sale of GOCO Tokens through multiple periods of 21 hours.

All Tokens are distributed to investors once the current period ends.

Constructor :
- `openingTime` : timestamp for opening time ;
- `wallet` : the wallet to receive funds at the end of the crowdsale ;
- `rewardpool` : reward wallet to receive the remaining tokens at the end of the crowdsale ;
- `numberOfPeriod` : number of sales periods ;
- `token` : GOCO Token contract ;

Sale requires to have GOCO Tokens in reserve in order to operate.

# 3. <a name="3"></a>Attacks verified

All attacks vector reviewed are listed here https://consensys.github.io/smart-contract-best-practices/known_attacks/

## Short address attack :ok_hand:

Quoted from [vessenes.com](https://vessenes.com/the-erc20-short-address-attack-explained/) :

>The server taking in user data allowed an Ethereum address that was less than 20 bytes: usually an Ethereum address looks like 0x1234567890123456789012345678901234567800.
What if you leave off those trailing two zeros (one hex byte equal to 0)? The Ethereum VM will supply it, but at the end of the packaged function arguments, and that's a very bad place to add extra zeros.

Thoughout the code there is only in `ERC20` that this attack might be possible and interesting for attacker. Specifically on functions `transfer`, `transferFrom` and `approve`.

The short address attack is prevented since [Solidity version 0.5.0](https://github.com/ethereum/solidity/pull/4224). All source code _MUST_ be at least at this version. The version of `ERC20` in OpenZeppelin is `^0.5.0`.

## Reentrancy :ok_hand:

Reentrancy attack was one used against the infamous TheDAO project. The basic usage of the attack is to fake revert with an attacker contract. The victim contract think something is failing while it's not. Here is a simplified example :

```js
contract VictimContract {
  mapping (address => uint) private balances;

  transfer(address to, uint256 value) external return (bool) {
    // call fallback of AttackContract
    (bool success, ) = to.call.value(value)("");
    require(success);

    // never updated
    balances[msg.sender] = balances[msg.sender].sub(value);
  }
}

contract AttackContract {
  // fallback function for reentrant
  function () {
    // call transfer of VictimContract
    VictimContract.transfer(0x123456789abcdef123, 10);
    throw;
  }
}
```

In GOCO contract there a only one place where reentrancy might be usable and interesting for attacker. It's the function `buyTokens`. `RetrancyGuard` is used, thus this function is protected against this attack. No untrusted call are made which avoid some reetrancy attacks.

## Number overflow :ok_hand:

All calculations are made through SafeMath. No overflow is possible.

## DoS with revert :ok_hand:

Denial of service by setting infinite revert is not possible.

It's an attack which consist on denying a function when it depends on a user address saved in contract state.

All requires are free from being indefinitely reverted depending on an attacker.

This attack is not possible.

## DoS with block GAS limit :ok_hand:

This DoS wouldn't cause real treat to the contract execution.

## Insufficient GAS grieffing :ok_hand:

Only possible when a proxy contract is used, it's not the case here.

## Forcibly Sending Ether to a Contract :ok_hand:

This attack would have no effect on the contract.

# 4. <a name="4"></a>Contract abuse

## Referral program in Presale :ok_hand:

There is no limitation on token distribution for referees and who refers to who.

`addReferee` takes two parameters, the referrer and the referee. There is not control on who refers to who. An abuser could watch investors address and put himself has their referee in order to profit from future buys by those investors.

There is no way to prevent this to happen. The contract has been updated to allow up to 10 referees in order to prevent the abuser to block and abuse the referral program.

# 5. <a name="5"></a>Major

| State                | Tag      | Contract       | Details       |
|----------------------|----------|:--------------:|---------------|
| :white_check_mark: | MAJOR_01 | GOCOPreSale.sol | Opening date can be updated and be greater than closing date. Should prevent this in case of human error |
| :white_check_mark: | MAJOR_02 | GOCOPreSale.sol | A referee can ba added even though the referral program is disabled. It can be a business logic, see `WATCH_02` |
| :heavy_minus_sign: | MAJOR_03 (removed) | GOCOSale.sol    | `buyTokens` should inherited from OpenZeppelin to profit from audited behaviors. Instructions order should be changed. `dailyTotals` and `userBuys` must be executed after `_postValidatePurchase`. Removed because GOCOSale doesn't inherit from Crowdsale. |
| :white_check_mark: | MAJOR_04 | GOCOSale.sol    | Increasing or decreasing the number of period should imply to update the token distribution, but it will conflict with passed periods and distribution caps |

# 6. <a name="6"></a>Medium

| State                | Tag       | Contract(s)    | Details       |
|----------------------|-----------|:--------------:|---------------|
| :white_check_mark: | MEDIUM_01 | GOCOPreSale.sol | Empty function |
| :white_check_mark: | MEDIUM_02 | GOCOPreSale.sol | `saleWallet` and `rewardPoolWallet` can be equals. |
| :heavy_minus_sign: | MEDIUM_03 (removed) | NA | NA |
| :white_check_mark: | MEDIUM_04 | GOCOPreSale.sol / GOCOSale.sol | Must inherit |
| :heavy_minus_sign: | MEDIUM_05 (removed) | GOCOPreSale.sol | Should used `require` instead of conditions. |
| :heavy_minus_sign: | MEDIUM_06 (removed) | GOCOPreSale.sol | `require` missing |
| :heavy_minus_sign: | MEDIUM_07 (removed) | GOCOSale.sol    | Should used `require` instead of conditions. |
| :white_check_mark: | MEDIUM_08 (moved) | GOCOSale.sol    | See MAJOR_03 |
| :white_check_mark: | MEDIUM_09 | GOCOToken.sol   | `teamWallet`, `tokenSaleWallet` and `rewardPoolWallet` can be equals and 0. |
| :ok_hand: | MEDIUM_10 | GOCOSale.sol    | `nonReentrant` modifier should be applied to external function. See [source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/ReentrancyGuard.sol). OK since OpenZeppelin uses `buyTokens` the same way. |
| :white_check_mark: | MEDIUM_11 | GOCOSale.sol    | Missing require |


# 7. <a name="7"></a>Minor

| State                | Tag      | Contract(s)                                 | Details       |
|----------------------|----------|:-------------------------------------------:|---------------|
| :white_check_mark: | MINOR_01 | GOCOPreSale.sol / GOCOSale.sol / GOCOToken.sol | Solidity pragma must be fixed. Remove `^` and should put last version. |
| :heavy_minus_sign: | MINOR_02 (removed) | NA | NA |
| :heavy_minus_sign: | MINOR_03 | GOCOPreSale.sol / GOCOSale.sol | Revert conditions for code readability. |
| :heavy_minus_sign: | MINOR_04 | GOCOPreSale.sol | Enhance instructions order, super._preValidatePurchase checks for earlier validations (such as amount = 0). |
| :white_check_mark: | MINOR_05 | GOCOPreSale.sol | `require` should be splitted for code readability. |
| :white_check_mark: | MINOR_06 | GOCOPreSale.sol | Enhance conditions. |
| :white_check_mark: | MINOR_07 | GOCOPreSale.sol | Add a `require` to avoid GAS consumption. |
| :white_check_mark: | MINOR_08 | GOCOSale.sol | Add a `require` to avoid human error. |
| :ok_hand: | MINOR_09 | GOCOSale.sol | Rename the function to be more explicit, should start by a verb. Self documentation conventions. |
| :white_check_mark: | MINOR_10 | GOCOSale.sol | Add constant variable for this value. |
| :white_check_mark: | MINOR_11 | GOCOSale.sol | Avoid ternaries. |
| :heavy_minus_sign: | MINOR_12 (removed) | GOCOSale.sol | Should call `token()`. Removed because is doesn't inherit from Crowdsale. |

# 8. <a name="8"></a>Watch

| State     | Tag      | Contract(s)   | Details      |
|-----------|----------|:-------------:|--------------|
| :ok_hand: | WATCH_01 | GOCOPreSale.sol | No inheritance for no apparent reason. Reason : the contracts needed to update private attributes from parent. |
| :white_check_mark: | WATCH_02 | GOCOPreSale.sol / GOCOSale.sol | Counter-intuitive referral behavior. |
| :ok_hand: | WATCH_03 | GOCOSale.sol | This function already exists in parent contract. |

# 9. <a name="9"></a>Solidity and OpenZeppelin version :white_check_mark:

Solidity is on pragma version `0.5.13`. OpenZeppelin Solidity is up to date `2.4.0`.

# 10. <a name="10"></a>Conclusion

**The last version of the contracts has no raised security issues.**

The source code follow audited contracts rules from OpenZeppelin. `SafeMath` is always used throughout calculations to avoid maths issues (overflow, zero division, etc.). Partial respect of inheritance but no threat raised.

OpenZeppelin contracts are audited by a professional community. Those contracts are not audited here.

Before deployment the contract _MUST_ be deployed on Ropsten with limited timers in order to test all periods in pre-prod environment. The pre-prod deployment should be the same for prod, with different parameters and network (mainnet).

The code require in general a little bit more comments for readability.

_Last edit on 18 December 2019_
