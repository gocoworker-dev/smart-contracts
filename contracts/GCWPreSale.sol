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
pragma solidity ^0.5.0;  // MINOR_01 : lock pragma version

import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';


/**
 * @title TimedCrowdsale
 * @dev Crowdsale accepting contributions only within a time frame.
 */
 // WATCH_01 Not using official TimedCrowdsale from OpenZeppelin
contract TimedCrowdsale is Crowdsale {
    using SafeMath for uint256;

    uint256 internal _openingTime;
    uint256 internal _closingTime;

    /**
     * @dev Reverts if not in crowdsale time range.
     */
    modifier onlyWhileOpen {
        require(isOpen());
        _;
    }

    /**
     * @dev Constructor, takes crowdsale opening and closing times.
     * @param openingTime Crowdsale opening time
     * @param closingTime Crowdsale closing time
     */
    constructor (uint256 openingTime, uint256 closingTime) public {
        // solhint-disable-next-line not-rely-on-time
        require(openingTime >= block.timestamp);
        require(closingTime > openingTime);

        _openingTime = openingTime;
        _closingTime = closingTime;
    }

    /**
     * @return the crowdsale opening time.
     */
    function openingTime() public view returns (uint256) {
        return _openingTime;
    }

    /**
     * @return the crowdsale closing time.
     */
    function closingTime() public view returns (uint256) {
        return _closingTime;
    }

    /**
     * @return true if the crowdsale is open, false otherwise.
     */
    function isOpen() public view returns (bool) {
        // MINOR_03 Inverse conditions for readability
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp >= _openingTime && block.timestamp <= _closingTime;
    }

    /**
     * @dev Checks whether the period in which the crowdsale is open has already elapsed.
     * @return Whether crowdsale period has elapsed
     */
    function hasClosed() public view returns (bool) {
        // MINOR_03 Inverse condition for readability
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp > _closingTime;
    }

    /**
     * @dev Extend parent behavior requiring to be within contributing period
     * @param beneficiary Token purchaser
     * @param weiAmount Amount of wei contributed
     */
    function _preValidatePurchase(address beneficiary, uint256 weiAmount) internal onlyWhileOpen view {
        super._preValidatePurchase(beneficiary, weiAmount);
    }
}

/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale with a one-off finalization action, where one
 * can do extra work after finishing.
 */
// WATCH_01 Not using official FinalizableCrowdsale from OpenZeppelin
contract FinalizableCrowdsale is TimedCrowdsale {
    using SafeMath for uint256;

    bool private _finalized;

    event CrowdsaleFinalized();

    constructor () internal {
        _finalized = false;
    }

    /**
     * @return true if the crowdsale is finalized, false otherwise.
     */
    function finalized() public view returns (bool) {
        return _finalized;
    }

    /**
     * @dev Must be called after crowdsale ends, to do some extra finalization
     * work. Calls the contract's finalization function.
     */
    function finalize() public {
        require(!_finalized);
        require(hasClosed());

        _finalized = true;

        _finalization();
        emit CrowdsaleFinalized();
    }

    /**
     * @dev Can be overridden to add finalization logic. The overriding function
     * should call super._finalization() to ensure the chain of finalization is
     * executed entirely.
     */
    function _finalization() internal {
        // solhint-disable-previous-line no-empty-blocks
        // MEDIUM_01 Does nothing, should call super._finalization()
    }
}


contract GCWPreSale is Ownable, CappedCrowdsale, FinalizableCrowdsale, Pausable {

  bool private referralEnabled;
  address private rewardPool;
  mapping (address => address) refereeMap; //map a referee adress to its referrer

  constructor(
    uint256 openingTime,
    uint256 closingTime,
    address payable saleWallet,
    address rewardPoolWallet,
    IERC20 gcwtoken
  )
    public
    Crowdsale(10, saleWallet, gcwtoken) //token price is 0.1 Ether, i.e 10 token unit (10^-18) by wei
    CappedCrowdsale(210000 ether) //Max cap  : 210,000 Ether = 2,100,000 tokens
    TimedCrowdsale(openingTime, closingTime)
  {
    // MEDIUM_02 Control saleWallet and rewardPoolWallet are different to avoid human error and
    // that they are set (not 0)
    rewardPool = rewardPoolWallet;
    referralEnabled = true;
  }

  function changeOpeningTime(uint256 openingTime) public onlyOwner {
      // MAJOR_01 Control new openingTime is lesser than _closingTime
      require(openingTime >= block.timestamp);
      _openingTime = openingTime;
  }

  function changeClosingTime(uint256 closingTime) public onlyWhileOpen onlyOwner {
      // MAJOR_01 Control new closingTime is greater than _openingTime
      require(closingTime >= block.timestamp);
      _closingTime = closingTime;
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
    // MINOR_04 This might be called after OpenZeppelin validation
    require(weiAmount >= 0.1 ether);
    super._preValidatePurchase(beneficiary, weiAmount);
  }

  // MAJOR_02 Only available when referralEnabled is true
  function addReferee(address from_referrer, address to_referee) public {
    // MINOR_05 Multiple requires for code readability
    require (from_referrer != address(0) && to_referee != address(0) && from_referrer != to_referee);
    // MINOR_06 Control if > 0
    require (token().balanceOf(from_referrer) != 0);
    require(refereeMap[to_referee]==address(0), 'This referee has already been added' );

    refereeMap[to_referee]=from_referrer;

  }

  /**
   * @dev called by the owner to enable referral program
   */
  function enableReferral() public onlyOwner{
    // MINOR_07 Require referralEnabled is false to avoid gas usage for nothing
    referralEnabled = true;
  }

  /**
   * @dev called by the owner to disable referral program
   */
  function disableReferral() public onlyOwner{
    // MINOR_07 Require referralEnabled is true to avoid gas usage for nothing
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
    // MEDIUM_05 Condition should be 2 requires
    // MEDIUM_06 Third require to check if beneficiary is an adress
    // WATCH_02 A better logic would be to let all listed referrees to get their reward
    // and use referre enabling for adding referree.
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
    // MEDIUM_04 Should call super._finalization()
  }

}
