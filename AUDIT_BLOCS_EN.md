# Audit report of GOCO Presale, Sale and Token smart contracts
#### _Edited on November 2019, by [Jonathan "Blocs" Serra](https://blocs.fr/)_

# Introduction

This report is about the three following contracts :
- [GCWToken](contracts/GCWToken.sol) : Gocoworker Token ;
- [GCWPreSale](contracts/GCWPreSale.sol) : GOCO Presale ;
- [GCWSale](contracts/GCWSale.sol) : GOCO sale with periods of 21 hours ;

All potential vulnerabilities and good code practices are noticed by 3 tags as commentaries written in the contracts source code and all related tests:
- `MAJOR_x` where x is a 2 digits number: This references all parts that have impact in contracts logics ;
- `MEDIUM_x` where x is a 2 digits number: This references all parts where particular care is required ;
- `MINOR_x` where x is a 2 digits number: This references all parts that can be enhanced for security or code readability ;
- `WATCH_x` where x is a 2 digits number: This references all parts when something is unsure about business logic;

# Summary

1. [Prelude](#1)
2. [Overview](#2)
3. [Attacks verified](#3)
4. [Major](#4)
5. [Medium](#5)
6. [Minor](#6)
7. [Watch](#7)
8. [Conclusion](#8)

# 1. <a name="1"></a>Prelude

This audit is not about viability of the business around contracts. Only source code quality and security is audited. This audit is delivered with the following:
- A report;
- Source code commented with references;
- Updates on unit tests;

# 2. <a name="2"></a>Overview

Les contrats consistent en la vente de jetons ERC20, implémentés avec la librairie [OpenZeppelin Solidity](https://github.com/OpenZeppelin/openzeppelin-contracts). La vente se déroule en deux étapes.
The contracts purpose is to sell GOCO (ERC20) Tokens, all integrated with [OpenZeppelin Solidity](https://github.com/OpenZeppelin/openzeppelin-contracts). The sale is splitted into 2 steps.

#### _Presale_

Limited quantity sale of GOCO Tokens. The Presale is followed with a referral program allowing referees and investors to receive Tokens as reward.

#### _Sale_

Limited quantity sale of GOCO Tokens through multiple periods of 21 hours.

All Tokens are distributed to investors once the sale ends.

# 3. <a name="3"></a>Attacks verified

## Short address attack

Quoted from [vessenes.com](https://vessenes.com/the-erc20-short-address-attack-explained/) :

>The server taking in user data allowed an Ethereum address that was less than 20 bytes: usually an Ethereum address looks like 0x1234567890123456789012345678901234567800.
What if you leave off those trailing two zeros (one hex byte equal to 0)? The Ethereum VM will supply it, but at the end of the packaged function arguments, and that's a very bad place to add extra zeros.

Thoughout the code there is only in `ERC20` that this attack might be possible and interesting for attacker. Specifically on functions `transfer`, `transferFrom` and `approve`.

The short address attack is prevented since [Solidity version 0.5.0](https://github.com/ethereum/solidity/pull/4224). All source code _must_ be at least at this version. The version of `ERC20` in OpenZeppelin is `^0.5.0`.

## Reentrancy

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

Although, be careful on tag `MAJOR_03` which is about this function.

## Number overflow

// TODO

## Claim

// TODO

# 4. <a name="4"></a>Major

|   | Tag      | Contract       | Details       |
|---|----------|:--------------:|---------------|
|[ ]| MAJOR_01 | GCWPreSale.sol | Opening date can be updated and be greater than closing date. Should prevent this in case of human error |
|[ ]| MAJOR_02 | GCWPreSale.sol | A referee can ba added even though the referral program is disabled. It can be a business logic, see `WATCH_02` |
|[ ]| MAJOR_03 | GCWSale.sol    | `buyTokens` should inherited from OpenZeppelin to profit from audited behaviors. Instructions order should be changed. `dailyTotals` and `userBuys` must be executed after `_postValidatePurchase` |

# 5. <a name="5"></a>Medium

| Tag       | Contract(s)    | Details       |
|-----------|:--------------:|---------------|
| MEDIUM_01 | GCWPreSale.sol | Empty function |
| MEDIUM_02 | GCWPreSale.sol | `saleWallet` and `rewardPoolWallet` can be equals. |
| MEDIUM_03 (removed) | NA | NA |
| MEDIUM_04 | GCWPreSale.sol / GCWSale.sol | Must inherit |
| MEDIUM_05 | GCWPreSale.sol | Should used `require` insteand of conditions. |
| MEDIUM_06 | GCWPreSale.sol | `require` missing |
| MEDIUM_07 | GCWSale.sol    | Should used `require` insteand of conditions. |
| MEDIUM_08 (moved) | GCWSale.sol    | See MAJOR_03 |
| MEDIUM_09 | GCWToken.sol   | `teamWallet`, `tokenSaleWallet` and `rewardPoolWallet` can be equals and 0. |
| MEDIUM_10 | GCWSale.sol    | `nonReentrant` modifier should be applied to external function. See [source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/ReentrancyGuard.sol) |

# 6. <a name="6"></a>Minor

| Tag      | Contract(s)                                 | Details       |
|----------|:-------------------------------------------:|---------------|
| MINOR_01 | GCWPreSale.sol / GCWSale.sol / GCWToken.sol | Solidity pragma must be fixed. Remove `^` and should put last version. |
| MINOR_02 (removed) | NA | NA |
| MINOR_03 | GCWPreSale.sol / GCWSale.sol | Revert conditions for code readability. |
| MINOR_04 | GCWPreSale.sol | Enhance instructions order. |
| MINOR_05 | GCWPreSale.sol | `require` should be splitted for code readability. |
| MINOR_06 | GCWPreSale.sol | Enhance conditions. |
| MINOR_07 | GCWPreSale.sol | Add a `require` to avoid GAS consumption. |
| MINOR_08 | GCWSale.sol | Add a `require` to avoid human error. |
| MINOR_09 | GCWSale.sol | Rename the function to be more explicit, should start by a verb. Self documentation conventions. |
| MINOR_10 | GCWSale.sol | Add constant variable for this value. |
| MINOR_11 | GCWSale.sol | Avoid ternaries. |
| MINOR_12 | GCWSale.sol | Should call `token()`. |

# 7. <a name="7"></a>Watch

| Tag      | Contract(s)    | Details       |
|----------|:--------------:|---------------|
| WATCH_01 | GCWPreSale.sol | No inheritance for no apparent reason. |
| WATCH_02 | GCWPreSale.sol / GCWSale.sol | Counter-intuitive referral behavior. |
| WATCH_03 | GCWSale.sol | This function already exists in parent contract. |

# 8. <a name="8"></a>Conclusion

The source code follow audited contracts rules from OpenZeppelin. SafeMath is always throughout calculations to avoid maths issues (overflow, zero division, etc.). Good respect of inheritance but require come enhancement.

OpenZeppelin contracts are audited by a professional community. Those contracts are not audited here.

**The code require in general a little bit more comments, especially around public functions** for opening more the contract to the public, it will facilitate investors confidence on the Token and the Sale.

_Last edit on 26 November 2019_
