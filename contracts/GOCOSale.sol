/**
    Copyright (c) 2019 Gocoworker

<<<<<<< HEAD:contracts/GOCOSale.sol
    GOCO ERC20 Token Sales Smart Contract    
=======
    GCW ERC20 Token Sales Smart Contract
>>>>>>> 8c5ea27... Adds first version of commit:contracts/GCWSale.sol
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
<<<<<<< HEAD:contracts/GOCOSale.sol
pragma solidity 0.5.13;
=======
pragma solidity ^0.5.0;  // MINOR_01 : lock pragma version
>>>>>>> 8c5ea27... Adds first version of commit:contracts/GCWSale.sol

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import 'openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol';
import 'openzeppelin-solidity/contracts/utils/Address.sol';

contract GOCOSale is Ownable, ReentrancyGuard, Pausable {

    using SafeMath for uint256;
    using SafeERC20 for ERC20Detailed;
    using Address for address payable;

    // The token being sold
    ERC20Detailed private _token;

    //Total number of token to purchase
    uint256 private _tokenCap;

    // Address where funds are collected
    address payable private _wallet;

    // Address of the reward pool
    address private _rewardpool;

    // Amount of wei raised
    uint256 private _weiRaised;

    uint256 internal  _openingTime;             // Time of first period opening
    uint256 internal  _closingTime;             // Time of last period closing

    bool private _finalized;

    uint256 public  _tokenByPeriod;         // Tokens sold in each period

    mapping (uint256 => uint256) public  dailyTotals;
    mapping (uint256 => mapping (address => uint256)) public userBuys;
    mapping (uint256 => mapping (address => bool)) public claimed;


    event CrowdsaleFinalized();
    event LogBuy      (uint256 period, address user, uint256 amount);
    event LogClaim    (uint256 period, address user, uint256 amount);

     /**
   * @dev Reverts if not in crowdsale time range.
   */
    modifier onlyWhileOpen {
        require(isOpen());
        _;
    }

    constructor(uint256 openingTime,
        address payable wallet,
        address rewardpool,
        uint256 numberOfPeriod,
        ERC20Detailed token
    ) public {

<<<<<<< HEAD:contracts/GOCOSale.sol
        
        require(numberOfPeriod > 0, "GOCOSale: number of period must be > 0");
        require(openingTime>block.timestamp, "GOCOSale: opening time must be > block timestamp");
        require(wallet != address(0), "GOCOSale: wallet is the zero address");
        require(rewardpool != address(0), "GOCOSale: rewardpool wallet is the zero address");
        require(address(token) != address(0), "GOCOSale: token address is the zero address");
=======

        require(numberOfPeriod > 0);
        // MINOR_08 Require openingTime is lesser than timestamp
        require(openingTime>0);
        require(wallet != address(0));
        require(rewardpool != address(0));
        require(address(token) != address(0));
>>>>>>> 8c5ea27... Adds first version of commit:contracts/GCWSale.sol

        _wallet = wallet;
        _rewardpool = rewardpool;
        _token = token;

        _tokenCap = 10500000 * (10 ** uint256(token.decimals()));

        _tokenByPeriod = _tokenCap.div(numberOfPeriod);

        _openingTime = openingTime;
<<<<<<< HEAD:contracts/GOCOSale.sol
        _closingTime = openingTime.add(numberOfPeriod.mul(periodDuration()));
=======
        // MINOR_10 21 hours should be a constant (pure fn internal or public)
        _closingTime = openingTime.add(numberOfPeriod.mul(21 hours));
>>>>>>> 8c5ea27... Adds first version of commit:contracts/GCWSale.sol
        _finalized = false;

    }

<<<<<<< HEAD:contracts/GOCOSale.sol
  
=======
>>>>>>> 8c5ea27... Adds first version of commit:contracts/GCWSale.sol
    function changeOpeningTime(uint256 openingTime, uint256 numberOfPeriod) public onlyOwner {
        require(!isOpen(), "GOCOSale: sale is already open");
        require(openingTime >= block.timestamp, "GOCOSale: opening time must be > block timestamp");
        _openingTime = openingTime;
        _closingTime = openingTime.add(numberOfPeriod.mul(periodDuration()));
        _tokenByPeriod = _tokenCap.div(numberOfPeriod);
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
    function finalize() public onlyOwner {
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
        _token.transfer(_rewardpool, _token.balanceOf(address(this)));
        // MEDIUM_04 Should call super._finalization()
    }

     /**
     * @dev fallback function ***DO NOT OVERRIDE***
     * Note that other contracts will transfer fund with a base gas stipend
     * of 2300, which is not enough to call buyTokens. Consider calling
     * buyTokens directly when purchasing tokens from a contract.
     */
     // WATCH_02 There is already a fallback with same instructions in Crowdsale, inherited
     // from PausableCrowdsale
    function () external payable {
        buyTokens(msg.sender);
    }


    function periodDuration() public pure returns (uint256) {
        return 21 hours;
    }
    /**
     * @return the token being sold.
     */
    function token() public view returns (ERC20Detailed) {
        return _token;
    }

      /**
     * @return the number of token by period.
     */
    function tokenByPeriod() public view returns (uint256) {
        return _tokenByPeriod;
    }

 /**
     * @return the amount of wei raised.
     */
    function weiRaised() public view returns (uint256) {
        return _weiRaised;
    }


    /**
     * @return the total number of token to purchase.
     */
    function tokenCap() public view returns (uint256) {
        return _tokenCap;
    }

    /**
     * @return the address where funds are collected.
     */
    function wallet() public view returns (address payable) {
        return _wallet;
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

    function time() public view returns (uint256) {
        return block.timestamp;
    }

    // MINOR_09 Should better named better
    function today() public view returns (uint256) {
        return periodFor(time());
    }

    function dailyTotal(uint256 period) public view returns (uint256) {
        return dailyTotals[period];
    }


    // Each window is 21 hours long so that end-of-window rotates
    // around the clock for all timezones.
    function periodFor(uint256 timestamp) public view returns (uint256) {
        // MINOR_11 Avoid ternaries for cade readability
        return timestamp < _openingTime
            ? 0
            : timestamp.sub(_openingTime).div(periodDuration()) + 1;
    }


    /**
    * @return true if the crowdsale is open, false otherwise.
    */
    function isOpen() public view returns (bool) {
        // MINOR_03 Inverse conditions for readability
        // solium-disable-next-line security/no-block-members
        return block.timestamp >= _openingTime && block.timestamp <= _closingTime;
    }

    /**
    * @dev Checks whether the period in which the crowdsale is open has already elapsed.
    * @return Whether crowdsale period has elapsed
    */
    function hasClosed() public view returns (bool) {
        // MINOR_03 Inverse conditions for readability
        // solium-disable-next-line security/no-block-members
        return block.timestamp > _closingTime;
    }


    // MAJOR_03 This should not be overriden. For extended code use
    // _preValidatePurchase for validations and ;
    // _postValidatePurchase for further instructions ;
    // userBuys and dailyTotal must be updated after transfer is successful, thus in
    // _postValidatePurchase
    function buyTokens(address beneficiary) public nonReentrant onlyWhileOpen whenNotPaused payable  {
<<<<<<< HEAD:contracts/GOCOSale.sol
    
        require(msg.value >= 0.1 ether, "GOCOSale: minimum contribution is 0.1 ether");
=======
        require(msg.value >= 0.1 ether);
>>>>>>> 8c5ea27... Adds first version of commit:contracts/GCWSale.sol

        uint256 weiAmount = msg.value;
        uint256 period = today();

        userBuys[period][beneficiary] = userBuys[period][beneficiary].add(weiAmount);
        dailyTotals[period] = dailyTotals[period].add(weiAmount);

        _weiRaised = _weiRaised.add(weiAmount);

        _forwardFunds();

        emit LogBuy(period, beneficiary, weiAmount);

    }
<<<<<<< HEAD:contracts/GOCOSale.sol
  
    function _claim(uint256 period, address beneficiary) internal {
        require(periodFor(time()-1 minutes) > period, "GOCOSale: claim is avalaible 1 minute after the end of the period");
        
=======

    function claim(uint256 period, address beneficiary) public nonReentrant whenNotPaused {
        require(today() > period);

        // MEDIUM_07 Those conditions should be 2 requires
>>>>>>> 8c5ea27... Adds first version of commit:contracts/GCWSale.sol
        if (claimed[period][beneficiary] || userBuys[period][beneficiary] == 0 || dailyTotals[period] == 0) {
            return;
        }

        uint256 reward = userBuys[period][beneficiary].mul(_tokenByPeriod);

	    reward = reward.div(dailyTotals[period]); //fixed precision prob by dividing after multiplication

        _token.transfer(beneficiary, reward);

<<<<<<< HEAD:contracts/GOCOSale.sol
        claimed[period][beneficiary] = true;
=======
        // MINOR_12 Should call token() instead
       _token.transfer(beneficiary, reward);
>>>>>>> 8c5ea27... Adds first version of commit:contracts/GCWSale.sol

        emit LogClaim(period, beneficiary, reward);
    }

    /**
    * @dev This is an especial owner-only function to make massive tokens claim for a given period.
    * @param period is the period to claim
    * @param beneficiaries is an array of claiming addresses
    */
    function batchClaim(uint256 period, address[] calldata beneficiaries) external nonReentrant {
        for (uint i = 0; i < beneficiaries.length; i++) {
            _claim(period,beneficiaries[i]);
        }
    }

    function claimAll(address beneficiary) external nonReentrant{
        for (uint256 i = 0; i < today(); i++) {
            _claim(i, beneficiary);
        }
    }

    function claim (uint256 period, address beneficiary) external nonReentrant {
        _claim(period, beneficiary);
    }

    /**
    * @dev Determines how ETH is stored/forwarded on purchases.
    */
    // WATCH_03 This fn already exists in Crowdsale with the same instructions
    function _forwardFunds() internal {
        _wallet.sendValue(msg.value);
    }

}
