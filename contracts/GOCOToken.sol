/**
    Copyright (c) 2019 Gocoworker

    GOCO ERC20 Token Sales Smart Contract    
    Version 0.1

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

    based on the contracts of OpenZeppelin:
    https://github.com/OpenZeppelin/zeppelin-solidity/tree/master/contracts
**/
pragma solidity 0.5.13;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';

/**
 * @title GOCOToken
 * @dev All tokens are pre-assigned to the team wallet, the sale wallet and the reward pool wallet.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `ERC20` functions.
 */
contract GOCOToken is ERC20, ERC20Detailed {

  //TOTAL SUPPLY IS 21,000,000 TOKENS
  
  uint256 public constant TEAM_SUPPLY = 7000000; //33.33% of the total supply goes to the team

  uint256 public constant TOKEN_SALE_SUPPLY = 12600000; //60% of the total supply goes to the token sale

  uint256 public constant REWARD_POOL_SUPPLY = 1400000; //6.666% of the total supply goes to the token sale

  /**
   * @dev Constructor that mint all the existing tokens and allocate them.
   */
  constructor(address teamWallet, address tokenSaleWallet, address rewardPoolWallet) public ERC20Detailed("Gocoworker", "GOCO", 18) {

    require(teamWallet != address(0) && tokenSaleWallet != address(0) && rewardPoolWallet != address(0), "GOCOToken: a wallet is the zero address");
    require(teamWallet != tokenSaleWallet && teamWallet != rewardPoolWallet && tokenSaleWallet != rewardPoolWallet, "GOCOToken: wallets are not different");
    _mint(teamWallet, TEAM_SUPPLY * (10 ** uint256(decimals())));
    _mint(tokenSaleWallet, TOKEN_SALE_SUPPLY * (10 ** uint256(decimals())));
    _mint(rewardPoolWallet, REWARD_POOL_SUPPLY * (10 ** uint256(decimals())));
  }

}
