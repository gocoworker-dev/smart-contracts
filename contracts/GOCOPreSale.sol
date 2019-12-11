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

import 'openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';


contract GOCOPreSale is Ownable, CappedCrowdsale, FinalizableCrowdsale, Pausable {

  bool private referralEnabled;
  address private rewardPool;
  mapping (address => address) refereeMap; //map a referee adress to its referrer
  mapping (address => uint8) referalCounter; //map a referer to a nb of referee

  constructor(
    uint256 openingTime,
    uint256 closingTime,
    address payable saleWallet,
    address rewardPoolWallet,
    IERC20 gocotoken
  )
    public
    Crowdsale(10, saleWallet, gocotoken) //token price is 0.1 Ether, i.e 10 token unit (10^-18) by wei
    CappedCrowdsale(210000 ether) //Max cap  : 210,000 Ether = 2,100,000 tokens
    TimedCrowdsale(openingTime, closingTime)
  {
    require(rewardPoolWallet != address(0), "GOCOPreSale: rewardPoolWallet is the zero address");
    rewardPool = rewardPoolWallet;
    referralEnabled = true;
  }


  function changeClosingTime(uint256 newClosingTime) public onlyOwner {
     _extendTime(newClosingTime);
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
    whenNotPaused
  {
    super._preValidatePurchase(beneficiary, weiAmount);
    require(weiAmount >= 0.1 ether, "GOCOPreSale: minimum contribution is 0.1 ether");
  }

  function addReferee(address from_referrer, address to_referee) public {
    require(referralEnabled, "GOCOPreSale: referral program is disabled");
    require (from_referrer != address(0) && to_referee != address(0), "GOCOPreSale: referrer or referee is the zero address");
    require (from_referrer != to_referee, "GOCOPreSale: referrer and referee are the same address");
    require (token().balanceOf(from_referrer) > 0, "GOCOPreSale: referrer has no token");
    require(refereeMap[to_referee]==address(0), 'GOCOPreSale: This referee has already been added');
    require(referalCounter[from_referrer] < 10, 'GOCOPreSale: referrer can not add more than 10 referee');

    refereeMap[to_referee] = from_referrer;
    referalCounter[from_referrer]++;

  }

  /**
   * @dev called by the owner to enable referral program
   */ 
  function enableReferral() public onlyOwner{
    require(!referralEnabled, "GOCOPreSale: referral program is already enabled");
    referralEnabled = true;
  }

  /**
   * @dev called by the owner to disable referral program
   */
  function disableReferral() public onlyOwner{
    require(referralEnabled, "GOCOPreSale: referral program is already disabled");
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
      token().transfer(beneficiary, tokenReferallAmount);
      token().transfer(refereeMap[beneficiary], tokenReferallAmount);
    }
  }

  /**
   * @dev Overrided finalization to transfer all unsold token to the reward pool
   */
  function _finalization() internal {
    super._finalization();
    token().transfer(rewardPool, token().balanceOf(address(this)));
  }

}
