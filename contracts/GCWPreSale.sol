/**
    Copyright (c) 2019 Gocoworker

    GCW ERC20 Token Sales Smart Contract    
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
pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract GCWPreSale is Ownable, CappedCrowdsale, FinalizableCrowdsale, Pausable {

  bool private referralEnabled;
  address private rewardPool;
  mapping (address => address) refereeMap; //map a referee adress to its referrer
  mapping (address => mapping(address => bool)) referralMap; //map a referrer adress to its referees

  constructor(
    uint256 openingTime,
    address payable saleWallet,
    address rewardPoolWallet,
    IERC20 gcwtoken
  )
    public
    Crowdsale(10, saleWallet, gcwtoken) //token price is 0.1 Ether, i.e 10 token unit (10^-18) by wei
    CappedCrowdsale(210000 ether) //Max cap  : 210,000 Ether = 2,100,000 tokens
    TimedCrowdsale(openingTime, openingTime + 12 weeks)
  {
    rewardPool = rewardPoolWallet;
    referralEnabled = true;
  }

  /**
   * @dev Extend parent behavior requiring to be unpaused
   * @param beneficiary Token purchaser
   * @param weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address beneficiary,
    uint256 weiAmount
  )
    internal
    view
    onlyWhileOpen
    whenNotPaused
  {
    super._preValidatePurchase(beneficiary, weiAmount);
  }

  function addReferee(address from_referrer, address to_referee) public onlyOwner{
    require (from_referrer != address(0) && to_referee != address(0) && from_referrer != to_referee);
    require(refereeMap[to_referee]==address(0), 'This referee has already been added' );

    referralMap[from_referrer][to_referee] = true;
    refereeMap[to_referee]=from_referrer;

  }

  /**
   * @dev called by the owner to enable referral program
   */
  function enableReferral() public onlyOwner{
    referralEnabled = true;
  }

  /**
   * @dev called by the owner to disable referral program
   */
  function disableReferral() public onlyOwner{
    referralEnabled = false;
  }


  /**
   * @dev Overrided for referral program call
   * @param beneficiary Address receiving the tokens
   * @param weiAmount Value in wei involved in the purchase
   */
  function _updatePurchasingState(
    address beneficiary,
    uint256 weiAmount
  )
    internal
  {
     if(referralEnabled && refereeMap[beneficiary]!=address(0)) {
      uint256 tokenReferallAmount = _getTokenAmount(weiAmount).div(20);
      token().transferFrom(rewardPool, beneficiary, tokenReferallAmount);
      token().transferFrom(rewardPool, refereeMap[beneficiary], tokenReferallAmount);     
     }

  }

  /**
   * @dev Overrided finalization to transfer all unsold token to the reward pool
   */
  function _finalization() internal {
    token().transfer(rewardPool, token().balanceOf(address(this)));
  }

}
