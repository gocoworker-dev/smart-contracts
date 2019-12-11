const { BN, ether, shouldFail, time, balance, expectEvent, constants } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;
const GOCOPreSale = artifacts.require('GOCOPreSale');
const GOCOToken = artifacts.require('GOCOToken');

async function tokenBalanceDifference (token, account, promiseFunc) {
  const balanceBefore = new BN(await token.balanceOf(account));
  await promiseFunc();
  const balanceAfter = new BN(await token.balanceOf(account));
  return balanceAfter.sub(balanceBefore);
}

contract('GOCOPreSale', function ([_, owner, founderAccount, tokenSaleAccount, rewardAccount, investor, anyone]) {
  const value = ether('1');
  const RATE = new BN(10);
  const CAP = ether('210000');

  const TOKEN_SUPPLY = new BN(2100000).mul(new BN(10).pow(new BN(18)));

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    const from = owner;
    this.openingTime = (await time.latest()).add(time.duration.weeks(1));
    this.closingTime = this.openingTime.add(time.duration.weeks(12));
    this.afterClosingTime = this.closingTime.add(time.duration.seconds(1));

    this.token = await GOCOToken.new(founderAccount, tokenSaleAccount, rewardAccount, { from });

    this.crowdsale = await GOCOPreSale.new(this.openingTime, this.closingTime, tokenSaleAccount, rewardAccount, this.token.address, { from });

    await this.token.transfer(this.crowdsale.address, TOKEN_SUPPLY, { from: tokenSaleAccount });
    //await this.token.approve(this.crowdsale.address, TOKEN_SUPPLY.div(new BN(10)), { from: rewardAccount }); // approve the crowdsale contract to transfer reward pool tokens
  });

  it('should create crowdsale with correct parameters', async function () {
    (await this.crowdsale.openingTime()).should.be.bignumber.equal(this.openingTime);
    (await this.crowdsale.closingTime()).should.be.bignumber.equal(this.closingTime);
    (await this.crowdsale.rate()).should.be.bignumber.equal(RATE);
    (await this.crowdsale.wallet()).should.be.equal(tokenSaleAccount);
    (await this.crowdsale.cap()).should.be.bignumber.equal(CAP);
  });

  it('should not accept payments before start', async function () {
    await shouldFail.reverting(this.crowdsale.send(ether('1')));
    await shouldFail.reverting(this.crowdsale.buyTokens(investor, { from: investor, value: ether('1') }));
  });

  it('should accept payments during the sale', async function () {
    const investmentAmount = ether('2');
    const expectedTokenAmount = RATE.mul(investmentAmount);

    await time.increaseTo(this.openingTime);

    try {    
      await this.crowdsale.buyTokens(investor, { value: investmentAmount, from: investor });
  
    } catch (error) {
      console.log(error) 
    }



    (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
  });

  it('should reject payments during the sale < 0.1 ether', async function () {
    await time.increaseTo(this.openingTime);
    await shouldFail.reverting(this.crowdsale.send(ether('0.01')));
    await shouldFail.reverting(this.crowdsale.buyTokens(investor, { value: ether('0.01'), from: investor }));
  });


  it('should reject payments after end', async function () {
    await time.increaseTo(this.afterClosingTime);
    await shouldFail.reverting(this.crowdsale.send(ether('1')));
    await shouldFail.reverting(this.crowdsale.buyTokens(investor, { value: ether('1'), from: investor }));
  });

  it('should reject payments over cap', async function () {
    await time.increaseTo(this.openingTime);
    await this.crowdsale.send(CAP);
    await shouldFail.reverting(this.crowdsale.send(1));
  });

  it('purchases work', async function () {
    await time.increaseTo(this.openingTime);
    await this.crowdsale.sendTransaction({ from: investor, value });
    await this.crowdsale.buyTokens(investor, { from: investor, value });
  });

  it('does immediately transfer funds to wallet ', async function () {
    await time.increaseTo(this.openingTime);

    (await balance.difference(tokenSaleAccount, async () => {
      await this.crowdsale.buyTokens(investor, { from: investor, value });
    })).should.be.bignumber.equal(value);
  });

  context('referral', function () {
    const referrer = anyone;
    const referee = investor;

    beforeEach(async function () {
      await time.increaseTo(this.openingTime);
    });

    describe('when the referrer or the referee are the zero address', function () {
      const zero = ZERO_ADDRESS;

      it('reverts', async function () {
        await shouldFail.reverting(this.crowdsale.addReferee(zero, referee, { from: owner }));
        await shouldFail.reverting(this.crowdsale.addReferee(referrer, zero, { from: owner }));
      });
    });

    describe('when the referrer and the referee are the same address', function () {
      it('reverts', async function () {
        await shouldFail.reverting(this.crowdsale.addReferee(referee, referee, { from: owner }));
      });
    });

    describe('when the referrer has no token', function () {
      it('reverts', async function () {
        await shouldFail.reverting(this.crowdsale.addReferee(referrer, referee, { from: owner }));
      });
    });

    describe('when the referrer add more than 10 referees', function () {
      it('reverts', async function () {
        let referee11Account = [11];
        for (var i = 0; i < 11; i++) {
          let address = '0x2bdd21761a483f71054e14f5b827213567971c' + (i + 16).toString(16);
          referee11Account[i] = address;
        }

        await this.crowdsale.buyTokens(referrer, { from: referrer, value });

        for (var i = 0; i < 10; i++) {
          await this.crowdsale.addReferee(referrer, referee11Account[i], { from: referrer });
        }

        await shouldFail.reverting(this.crowdsale.addReferee(referrer, referee11Account[10], { from: referrer }));
      });
    });


    describe('when the addReferee function is called by a referrer that has token, with referrer != referee', function () {
      beforeEach(async function () {
        await this.crowdsale.buyTokens(referrer, { from: referrer, value });
        await this.crowdsale.addReferee(referrer, referee, { from: referrer });
      });

      it('when referee buy tokens, reward tokens are transfered to referrer and referee', async function () {
        const expectedTokenPurchased = RATE.mul(value);
        const expectedTokenReward = expectedTokenPurchased.div(new BN(20)); // 5% reward

        await this.crowdsale.buyTokens(referee, { from: referee, value });
        (await this.token.balanceOf(referee)).should.be.bignumber.equal(expectedTokenPurchased.add(expectedTokenReward));
        (await this.token.balanceOf(referrer)).should.be.bignumber.equal(expectedTokenReward.add(RATE.mul(value)));
      });

      it('when referal is disabled, should not transfer rewards', async function () {
        const expectedTokenPurchased = RATE.mul(value);
        await this.crowdsale.disableReferral({ from: owner });
        await this.crowdsale.buyTokens(referee, { from: referee, value });
        (await this.token.balanceOf(referee)).should.be.bignumber.equal(expectedTokenPurchased);
        (await this.token.balanceOf(referrer)).should.be.bignumber.equal(RATE.mul(value));
      });
    });
  });

  context('after pause', function () {
    beforeEach(async function () {
      await time.increaseTo(this.openingTime);
      await this.crowdsale.pause({ from: owner });
    });

    it('purchases do not work', async function () {
      await shouldFail.reverting(this.crowdsale.sendTransaction({ from: investor, value }));
      await shouldFail.reverting(this.crowdsale.buyTokens(investor, { from: investor, value }));
    });

    context('after unpause', function () {
      beforeEach(async function () {
        await this.crowdsale.unpause({ from: owner });
      });

      it('purchases work', async function () {
        await this.crowdsale.sendTransaction({ from: investor, value });
        await this.crowdsale.buyTokens(investor, { from: investor, value });
      });
    });
  });

  context('finalization', function () {
    it('cannot be finalized before ending', async function () {
      await shouldFail.reverting(this.crowdsale.finalize({ from: anyone }));
    });

    it('can be finalized by anyone after ending', async function () {
      await time.increaseTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: anyone });
    });

    it('cannot be finalized twice', async function () {
      await time.increaseTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: anyone });
      await shouldFail.reverting(this.crowdsale.finalize({ from: anyone }));
    });

    it('logs finalized', async function () {
      await time.increaseTo(this.afterClosingTime);
      const { logs } = await this.crowdsale.finalize({ from: anyone });
      expectEvent.inLogs(logs, 'CrowdsaleFinalized');
    });

    it('should transfer unsold token to reward pool after finalization, token sale contract is now empty', async function () {
      await time.increaseTo(this.openingTime);
      await this.crowdsale.send(ether('1000'));
      await time.increaseTo(this.afterClosingTime);

      const UNSOLD_TOKEN = TOKEN_SUPPLY.sub(ether('1000').mul(RATE));

      (await tokenBalanceDifference(this.token, rewardAccount, async () => {
        await this.crowdsale.finalize({ from: anyone });
      })).should.be.bignumber.equal(UNSOLD_TOKEN);

      (await balance.current(this.crowdsale.address)).should.be.bignumber.equal(new BN(0));

      (await this.token.balanceOf(this.crowdsale.address)).should.be.bignumber.equal(new BN(0));
    });
  });
});
