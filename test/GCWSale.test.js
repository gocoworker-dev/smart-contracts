const { BN, ether, shouldFail, time, balance, expectEvent, constants } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;
const GCWSale = artifacts.require('GCWSale');
const GCWToken = artifacts.require('GCWToken');


async function tokenBalanceDifference (token, account, promiseFunc) {
  const balanceBefore = new BN(await token.balanceOf(account));
  await promiseFunc();
  const balanceAfter = new BN(await token.balanceOf(account));
  return balanceAfter.sub(balanceBefore);
}

contract('GCWSale', function ([_, owner, founderAccount, tokenSaleAccount, rewardAccount, investor1, investor2, investor3, anyone]) {
  
  const value = ether('1');
  
  const TOKEN_BY_PERIOD = new BN(42000).mul(new BN(10).pow(new BN(18)));
  const NUMBER_OF_PERIOD = new BN(4);
  const TOKEN_SUPPLY = TOKEN_BY_PERIOD.mul(NUMBER_OF_PERIOD);
    
  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    const from = owner;
    this.openingTime = (await time.latest()).add(time.duration.weeks(1));
    this.closingTime = this.openingTime.add(time.duration.hours(21).mul(NUMBER_OF_PERIOD));
    this.afterClosingTime = this.closingTime.add(time.duration.seconds(1));

    this.token = await GCWToken.new(founderAccount, tokenSaleAccount, rewardAccount, { from });
    
    this.crowdsale = await GCWSale.new(this.openingTime, tokenSaleAccount, rewardAccount, NUMBER_OF_PERIOD, TOKEN_BY_PERIOD, this.token.address, { from });
    
    await this.token.approve(this.crowdsale.address,  TOKEN_BY_PERIOD.mul(NUMBER_OF_PERIOD), {from : tokenSaleAccount}); //approve the crowdsale contract to transfer tokenSaleAccount tokens
  });

  it('should create crowdsale with correct parameters', async function () {
 
    (await this.crowdsale.openingTime()).should.be.bignumber.equal(this.openingTime);
    (await this.crowdsale.closingTime()).should.be.bignumber.equal(this.closingTime);
    (await this.crowdsale.wallet()).should.be.equal(tokenSaleAccount);
    (await this.crowdsale.tokenByPeriod()).should.be.bignumber.equal(TOKEN_BY_PERIOD);
    (await this.crowdsale.tokenCap()).should.be.bignumber.equal(TOKEN_SUPPLY);

  
  });

  it('should not accept payments before start', async function () {
    await shouldFail.reverting(this.crowdsale.send(ether('1')));
    await shouldFail.reverting(this.crowdsale.buyTokens(investor1, { from: investor1, value: ether('1') }));
  });

  context('When the sale is open with 3 investors purchasing tokens on first period',  function () {

    const investmentAmount = ether('1');
    const expectedTokenAmount = investmentAmount.mul(TOKEN_BY_PERIOD.div(investmentAmount.mul(new BN(3))));

    beforeEach(async function () {
      await time.increaseTo(this.openingTime);
    });

    it('should be period 1 ', async function () {
    (await this.crowdsale.today()).should.be.bignumber.equal(new BN(1));
    });

    it('should accept payments from investors ', async function () {
    const { logs } = await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
    await this.crowdsale.send(investmentAmount, {from: investor2});
    await this.crowdsale.buyTokens(investor3, { value: investmentAmount, from: investor3});

    (await this.crowdsale.dailyTotal(new BN(1))).should.be.bignumber.equal(ether('3'));

    expectEvent.inLogs(logs, 'LogBuy', {
        period: new BN(1),
        user: investor1,
        amount: investmentAmount,
    });
    });

    it('should be period 2 ', async function () {
    //increase time to the end of the current period
    await time.increaseTo(this.openingTime.add(time.duration.hours(22)));
    (await this.crowdsale.today()).should.be.bignumber.equal(new BN(2));
    });


    it('should claim and transfer token to investors ', async function () {
    
    await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
    await this.crowdsale.send(investmentAmount, {from: investor2});
    await this.crowdsale.buyTokens(investor3, { value: investmentAmount, from: investor3});;
    
    //increase time to the end of the current period
    await time.increaseTo(this.openingTime.add(time.duration.hours(22)));
    
    await this.crowdsale.claim(new BN(1), investor1, {from: anyone});
    await this.crowdsale.claim(new BN(1), investor2, {from: anyone});
    await this.crowdsale.claim(new BN(1), investor3, {from: anyone});
    

    (await this.token.balanceOf(investor1)).should.be.bignumber.equal(expectedTokenAmount);
    (await this.token.balanceOf(investor2)).should.be.bignumber.equal(expectedTokenAmount);
    (await this.token.balanceOf(investor3)).should.be.bignumber.equal(expectedTokenAmount);
    });

    
    it('should claim and transfer token to investors : asymetric ', async function () {
    
        await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
        await this.crowdsale.send(investmentAmount.mul(new BN(2)), {from: investor2});
        await this.crowdsale.buyTokens(investor3, { value: investmentAmount.mul(new BN(3)), from: investor3});;
        
        //increase time to the end of the current period
        await time.increaseTo(this.openingTime.add(time.duration.hours(22)));
        
        await this.crowdsale.claim(new BN(1), investor1, {from: anyone});
        await this.crowdsale.claim(new BN(1), investor2, {from: anyone});
        await this.crowdsale.claim(new BN(1), investor3, {from: anyone});
        
        const baseExpectedTokenAmount = TOKEN_BY_PERIOD.div(new BN(6));
        (await this.token.balanceOf(investor1)).should.be.bignumber.equal(baseExpectedTokenAmount);
        (await this.token.balanceOf(investor2)).should.be.bignumber.equal(baseExpectedTokenAmount.mul(new BN(2)));
        (await this.token.balanceOf(investor3)).should.be.bignumber.equal(baseExpectedTokenAmount.mul(new BN(3)));
    });

    it('should fail purchase < 0.1 ether' , async function () {
    await shouldFail.reverting(this.crowdsale.buyTokens(investor1, { value: ether('0.01') , from: investor1}));
    });

    it('should reject payments after end', async function () {
    await time.increaseTo(this.afterClosingTime);
    await shouldFail.reverting(this.crowdsale.send(ether('1')));
    await shouldFail.reverting(this.crowdsale.buyTokens(investor1, { value: ether('1'), from: investor1 }));
    });

    it('should claim token even after end', async function () {
    await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
    await time.increaseTo(this.afterClosingTime);
    await this.crowdsale.claim(new BN(1), investor1, {from: anyone});
    (await this.token.balanceOf(investor1)).should.be.bignumber.equal(TOKEN_BY_PERIOD);     
    });
    
  });

  context('When the sale is open with 3 investors purchasing tokens on several period',  function () {

    const investmentAmount = ether('1');
    const expectedTokenAmount = investmentAmount.mul(TOKEN_BY_PERIOD.div(investmentAmount.mul(new BN(3))));

  
 
    describe('when first period ', function () {

      beforeEach(async function () {
        await time.increaseTo(this.openingTime);
      });
      
      
      it('should be period 1 ', async function () {
        (await this.crowdsale.today()).should.be.bignumber.equal(new BN(1));
      });

      it('should accept payments from investors ', async function () {
        const { logs } = await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
        await this.crowdsale.send(investmentAmount, {from: investor2});
        await this.crowdsale.buyTokens(investor3, { value: investmentAmount, from: investor3});

        (await this.crowdsale.dailyTotal(new BN(1))).should.be.bignumber.equal(ether('3'));

        expectEvent.inLogs(logs, 'LogBuy', {
            period: new BN(1),
            user: investor1,
            amount: investmentAmount,
        });
      });

      it('should reject early claim', async function () {        
        await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
        await shouldFail.reverting(this.crowdsale.claim(new BN(1), investor1, {from: anyone}));      
      });
    
    });
    
    describe('when second period', function () {

        beforeEach(async function () {
            await time.increaseTo(this.openingTime.add(time.duration.hours(21)));
        });

        it('should be period 2 ', async function () {
            (await this.crowdsale.today()).should.be.bignumber.equal(new BN(2));
        });

        it('should accept payments from investors ', async function () {
            const { logs } = await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
            await this.crowdsale.send(investmentAmount, {from: investor2});
            await this.crowdsale.buyTokens(investor3, { value: investmentAmount, from: investor3});
    
            (await this.crowdsale.dailyTotal(new BN(2))).should.be.bignumber.equal(ether('3'));
    
            expectEvent.inLogs(logs, 'LogBuy', {
                period: new BN(2),
                user: investor1,
                amount: investmentAmount,
            });
        });
        
        it('should reject early claim', async function () {        
            await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
            await shouldFail.reverting(this.crowdsale.claim(new BN(2), investor1, {from: anyone}));      
        });
    });


    it('when every period are purchased and tokens are all claimed later : funds raised and token amounts should be consistent', async function () {
    
            //PERIOD 1
            await time.increaseTo(this.openingTime);

            await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
            await this.crowdsale.send(investmentAmount, {from: investor2});
            await this.crowdsale.buyTokens(investor3, { value: investmentAmount, from: investor3});
    
            (await this.crowdsale.dailyTotal(new BN(1))).should.be.bignumber.equal(ether('3'));

            //PERIOD 2
            await time.increaseTo(this.openingTime.add(time.duration.hours(21)));
            
            await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
            await this.crowdsale.send(investmentAmount, {from: investor2});
            await this.crowdsale.buyTokens(investor3, { value: investmentAmount, from: investor3});
    
            (await this.crowdsale.dailyTotal(new BN(2))).should.be.bignumber.equal(ether('3'));
        
            //PERIOD 3
            await time.increaseTo(this.openingTime.add(time.duration.hours(21*2)));
        
            await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
            await this.crowdsale.send(investmentAmount, {from: investor2});
            await this.crowdsale.buyTokens(investor3, { value: investmentAmount, from: investor3});
    
            (await this.crowdsale.dailyTotal(new BN(3))).should.be.bignumber.equal(ether('3'));
        
            //PERIOD 4
            await time.increaseTo(this.openingTime.add(time.duration.hours(21*3)));
        
            await this.crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1});
            await this.crowdsale.send(investmentAmount, {from: investor2});
            await this.crowdsale.buyTokens(investor3, { value: investmentAmount, from: investor3});
    
            (await this.crowdsale.dailyTotal(new BN(4))).should.be.bignumber.equal(ether('3'));
        
            //PERIOD 5 (after end)
            await time.increaseTo(this.openingTime.add(time.duration.hours(21*4)).add(time.duration.seconds(1)));
            await shouldFail.reverting(this.crowdsale.send(ether('1')));
            await shouldFail.reverting(this.crowdsale.buyTokens(investor1, { value: ether('1'), from: investor1 }));


            (await this.crowdsale.weiRaised()).should.be.bignumber.equal(ether('12'));

            await this.crowdsale.claimAll(investor1, {from: anyone});
            await this.crowdsale.claimAll(investor2, {from: anyone});
            await this.crowdsale.claimAll(investor3, {from: anyone});
            
            (await this.token.balanceOf(investor1)).should.be.bignumber.equal(expectedTokenAmount.mul(new BN(4)));
            (await this.token.balanceOf(investor2)).should.be.bignumber.equal(expectedTokenAmount.mul(new BN(4)));
            (await this.token.balanceOf(investor3)).should.be.bignumber.equal(expectedTokenAmount.mul(new BN(4)));
               
    });
  });

  context('after pause', function () {
    beforeEach(async function () {
      await time.increaseTo(this.openingTime);
      await this.crowdsale.pause({ from: owner });
    });

    it('purchases do not work', async function () {
      await shouldFail.reverting(this.crowdsale.sendTransaction({ from: investor1, value }));
      await shouldFail.reverting(this.crowdsale.buyTokens(investor1, { from: investor1, value }));
    });

    context('after unpause', function () {
      beforeEach(async function () {
        await this.crowdsale.unpause({ from: owner });
      });

      it('purchases work', async function () {
        await this.crowdsale.sendTransaction({ from: investor1, value });
        await this.crowdsale.buyTokens(investor1, { from: investor1, value });
      });
    });
  });
});


/*
contract EOSSaleTest is DSTest, DSExec {
    TestableEOSSale  sale;
    DSToken          EOS;
    DSGuard          guard;
    TestUser         user1;
    TestUser         user2;
    TestOwner        owner;
    uint             window;

    function setUp() {
        string memory x = new string(1);

        EOS = new DSToken("EOS");
        window = 0;

        sale = new TestableEOSSale(
            5, 156.25 ether, now, block.timestamp + 1 days, 10 ether, x
        );

        EOS.setOwner(sale);
        sale.initialize(EOS);

        sale.addTime(now + 1);

        user1 = new TestUser(sale);
        user2 = new TestUser(sale);
        owner = new TestOwner(sale);

        user1.transfer(100 ether);
        user2.transfer(100 ether);

        guard = new DSGuard();
        guard.okay(owner, sale);

        sale.setAuthority(guard);
    }

    function addTime() {
        sale.addTime(1 days);
    }

    function nextRound(uint wad, uint wad1, uint wad2) {
        if (wad != 0) sale.buy.value(wad)();
        if (wad1 != 0) user1.doBuy(wad1);
        if (wad2 != 0) user2.doBuy(wad2);

        addTime();

        sale.claim(window);
        user1.doClaim(window);
        user2.doClaim(window);

        window++;
    }

    function testFailBuyBeforeOpen() {
        string memory x = new string(1);
        sale = new TestableEOSSale(
            5, 156.25 ether, now + 1, block.timestamp + 1 days, 10 ether, x
        );
        sale.addTime(now);
        sale.buy.value(1 ether)();
    }

    function testBuy() {
        sale.buy.value(1 ether)();
    }

    function testBuyWithLimit() {
        sale.buyWithLimit.value(1 ether)(0, 2 ether);
        assertEq(sale.userBuys(0, address(this)), 1 ether);
    }

    function testFailBuyOverLimit() {
        user1.doBuy(1 ether);
        sale.buyWithLimit.value(1 ether)(0, 1.5 ether);
    }

    function testBuyOverLimitLaterWindow() {
        user1.doBuy(1 ether);
        sale.buyWithLimit.value(1 ether)(3, 1.5 ether);
    }

    function testBuyLaterWindow() {
        sale.buyWithLimit.value(1 ether)(3, 2 ether);
        assertEq(sale.userBuys(0, address(this)), 0);
        assertEq(sale.userBuys(2, address(this)), 0);
        assertEq(sale.userBuys(3, address(this)), 1 ether);
        assertEq(sale.userBuys(4, address(this)), 0);
    }

    function testFailBuyTooLate() {
        addTime();
        sale.buyWithLimit.value(1 ether)(0, 0);
    }

    function testBuyFirstDay() {
        sale.buy.value(1 ether)();
        sale.addTime(1 days);
        sale.claim(0);
        assertEq(EOS.balanceOf(this), 31.25 ether);
    }

    function testBuyFirstAndSecondDay() {
        sale.buy.value(1 ether)();
        sale.addTime(1 days);
        sale.claim(0);
        assertEq(EOS.balanceOf(this), 31.25 ether);

        sale.buy.value(1 ether)();
        sale.addTime(1 days);
        sale.claim(1);
        // 23 tokens issued per day after first day
        assertEq(EOS.balanceOf(this), 54.25 ether);
    }

    function testFailSaleOver() {
        sale.addTime(6 days);
        sale.buy.value(1 ether)();
    }

    function testFailSmallBuy() {
        nextRound(1 finney, 0, 0);
    }

    function testLargeBuy() {
        nextRound(1001 ether, 0, 0);
    }

    function testAllDistributed() {
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);

        assertEq(EOS.balanceOf(this), 146.25 ether);
    }

    function testClaim() {
        nextRound(1 ether, 0, 0);
        assertEq(EOS.balanceOf(this), 31.25 ether);
    }

    function testClaimZeroContribution() {
        nextRound(0, 0, 0);
    }

    function testFailEarlyClaim() {
        sale.claim(2);
    }

    function testFailEarlyFreeze() {
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);

        // try release at the start of the third round
        user1.doFreeze();
    }

    function testMultiUser() {
        nextRound(1 ether, 1 ether, 0);
        assertEq(EOS.balanceOf(this), 15.625 ether);
        assertEq(EOS.balanceOf(user1), 15.625 ether);
    }

    function testMultiUserAsymmetricBid() {
        nextRound(1 ether, 9 ether, 0);
        assertEq(EOS.balanceOf(this), 3.125 ether);
        assertEq(EOS.balanceOf(user1), 28.125 ether);
    }

    // is this an issue?
    function testRepeatingDecimalRoundUp() {
        nextRound(1 ether, 1 ether, 1 ether);
        assertEq(EOS.balanceOf(this), 10416666666666666667);
        assertEq(EOS.balanceOf(user1), 10416666666666666667);
        assertEq(EOS.balanceOf(user2), 10416666666666666667);
    }

    function testRepeatingDecimalRoundDown() {
        addTime();
        window++;

        nextRound(5 ether, 1 ether, 0);
        assertEq(EOS.balanceOf(this), 19166666666666666665);
        assertEq(EOS.balanceOf(user1), 3833333333333333333);
    }

    function testFreeze() {
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        assertEq(EOS.balanceOf(this), 146.25 ether);

        // one extra day to trade
        addTime();

        user1.doFreeze();
    }

    function testCollect() {
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        assertEq(EOS.balanceOf(this), 146.25 ether);

        owner.doCollect();
        assertEq(owner.balance, 6 ether);
    }

    function testMultiUserFinalize() {
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        assertEq(EOS.balanceOf(this), 73.125 ether);
        assertEq(EOS.balanceOf(user1), 73.125 ether);
        addTime();

        owner.doCollect();
        assertEq(owner.balance, 12 ether);

        user1.doFreeze();
    }

    function testMultiUserAsymmetricBidFinalize() {
        nextRound(9 ether, 1 ether, 0);
        nextRound(4 ether, 1 ether, 0);
        nextRound(1 ether, 9 ether, 10 ether);
        nextRound(1 ether, 12 ether, 12 ether);
        nextRound(12 ether, 1 ether, 12 ether);
        nextRound(12 ether, 12 ether, 1 ether);
        assertEq(EOS.balanceOf(this), 70.675 ether);
        assertEq(EOS.balanceOf(user1), 41.075 ether);
        assertEq(EOS.balanceOf(user2), 34.5 ether);
        addTime();

        owner.doCollect();
        assertEq(owner.balance, 110 ether);

        user1.doFreeze();
    }

    function testClaimAll() {
        sale.buy.value(1 ether)();
        addTime();
        sale.buy.value(1 ether)();
        addTime();
        sale.buy.value(1 ether)();
        addTime();

        assertEq(EOS.balanceOf(this), 0);

        sale.claimAll();
        assertEq(EOS.balanceOf(this), 77.25 ether);
    }

    function testClaimAllZeroContribution() {
        sale.buy.value(1 ether)();
        addTime();
        addTime(); // skip a day
        sale.buy.value(1 ether)();
        addTime();
        sale.buy.value(1 ether)();
        addTime();

        assertEq(EOS.balanceOf(this), 0);

        sale.claimAll();
        assertEq(EOS.balanceOf(this), 77.25 ether);
    }

 
*/
////////