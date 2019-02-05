const { BN, constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const GCWToken = artifacts.require('GCWToken');


contract('GCWToken', function ([_, founderAccount, tokenSaleAccount, rewardAccount, recipient, anotherAccount]) {
  const totalSupply = new BN(21000000).mul(new BN(10).pow(new BN(18)));

  const founderSupply = new BN(6930000).mul(new BN(10).pow(new BN(18)));
  const saleSupply = new BN(12600000).mul(new BN(10).pow(new BN(18)));
  const rewardSupply = new BN(1470000).mul(new BN(10).pow(new BN(18)));


  beforeEach(async function () {
    this.token = await GCWToken.new(founderAccount, tokenSaleAccount, rewardAccount);
  });

  it('has a name', async function () {
    (await this.token.name()).should.equal('GoCoworker');
  });

  it('has a symbol', async function () {
    (await this.token.symbol()).should.equal('GCW');
  });

  it('has 18 decimals', async function () {
    (await this.token.decimals()).should.be.bignumber.equal('18');
  });

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      (await this.token.totalSupply()).should.be.bignumber.equal(totalSupply);
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        (await this.token.balanceOf(anotherAccount)).should.be.bignumber.equal('0');
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens for founders/teams', async function () {
        (await this.token.balanceOf(founderAccount)).should.be.bignumber.equal(founderSupply);
      });

      it('returns the total amount of tokens for token sales', async function () {
        (await this.token.balanceOf(tokenSaleAccount)).should.be.bignumber.equal(saleSupply);
      });

      it('returns the total amount of tokens for reward pool', async function () {
        (await this.token.balanceOf(rewardAccount)).should.be.bignumber.equal(rewardSupply);
      });

    });
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = saleSupply.addn(1);

        it('reverts', async function () {
          await shouldFail.reverting(this.token.transfer(to, amount, { from: tokenSaleAccount }));
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = saleSupply;

        it('transfers the requested amount', async function () {
          await this.token.transfer(to, amount, { from: tokenSaleAccount });

          (await this.token.balanceOf(tokenSaleAccount)).should.be.bignumber.equal('0');

          (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
        });

        it('emits a transfer event', async function () {
          const { logs } = await this.token.transfer(to, amount, { from: tokenSaleAccount });

          expectEvent.inLogs(logs, 'Transfer', {
            from: tokenSaleAccount,
            to: to,
            value: amount,
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await shouldFail.reverting(this.token.transfer(to, saleSupply, { from: tokenSaleAccount }));
      });
    });
  });

  describe('transfer from', function () {
    const spender = recipient;

    describe('when the recipient is not the zero address', function () {
      const to = anotherAccount;

      describe('when the spender has enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, saleSupply, { from: tokenSaleAccount });
        });

        describe('when the initial holder has enough balance', function () {
          const amount = saleSupply;

          it('transfers the requested amount', async function () {
            await this.token.transferFrom(tokenSaleAccount, to, amount, { from: spender });

            (await this.token.balanceOf(tokenSaleAccount)).should.be.bignumber.equal('0');

            (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
          });

          it('decreases the spender allowance', async function () {
            await this.token.transferFrom(tokenSaleAccount, to, amount, { from: spender });

            (await this.token.allowance(tokenSaleAccount, spender)).should.be.bignumber.equal('0');
          });

          it('emits a transfer event', async function () {
            const { logs } = await this.token.transferFrom(tokenSaleAccount, to, amount, { from: spender });

            expectEvent.inLogs(logs, 'Transfer', {
              from: tokenSaleAccount,
              to: to,
              value: amount,
            });
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.transferFrom(tokenSaleAccount, to, amount, { from: spender });

            expectEvent.inLogs(logs, 'Approval', {
              owner: tokenSaleAccount,
              spender: spender,
              value: await this.token.allowance(tokenSaleAccount, spender),
            });
          });
        });

        describe('when the initial holder does not have enough balance', function () {
          const amount = saleSupply.addn(1);

          it('reverts', async function () {
            await shouldFail.reverting(this.token.transferFrom(tokenSaleAccount, to, amount, { from: spender }));
          });
        });
      });

      describe('when the spender does not have enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, saleSupply.subn(1), { from: tokenSaleAccount });
        });

        describe('when the initial holder has enough balance', function () {
          const amount = saleSupply;

          it('reverts', async function () {
            await shouldFail.reverting(this.token.transferFrom(tokenSaleAccount, to, amount, { from: spender }));
          });
        });

        describe('when the initial holder does not have enough balance', function () {
          const amount = saleSupply.addn(1);

          it('reverts', async function () {
            await shouldFail.reverting(this.token.transferFrom(tokenSaleAccount, to, amount, { from: spender }));
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const amount = saleSupply;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await this.token.approve(spender, amount, { from: tokenSaleAccount });
      });

      it('reverts', async function () {
        await shouldFail.reverting(this.token.transferFrom(tokenSaleAccount, to, amount, { from: spender }));
      });
    });
  });

  describe('decrease allowance', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      function shouldDecreaseApproval (amount) {
        describe('when there was no approved amount before', function () {
          it('reverts', async function () {
            await shouldFail.reverting(this.token.decreaseAllowance(spender, amount, { from: tokenSaleAccount }));
          });
        });

        describe('when the spender had an approved amount', function () {
          const approvedAmount = amount;

          beforeEach(async function () {
            ({ logs: this.logs } = await this.token.approve(spender, approvedAmount, { from: tokenSaleAccount }));
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.decreaseAllowance(spender, approvedAmount, { from: tokenSaleAccount });

            expectEvent.inLogs(logs, 'Approval', {
              owner: tokenSaleAccount,
              spender: spender,
              value: new BN(0),
            });
          });

          it('decreases the spender allowance subtracting the requested amount', async function () {
            await this.token.decreaseAllowance(spender, approvedAmount.subn(1), { from: tokenSaleAccount });

            (await this.token.allowance(tokenSaleAccount, spender)).should.be.bignumber.equal('1');
          });

          it('sets the allowance to zero when all allowance is removed', async function () {
            await this.token.decreaseAllowance(spender, approvedAmount, { from: tokenSaleAccount });
            (await this.token.allowance(tokenSaleAccount, spender)).should.be.bignumber.equal('0');
          });

          it('reverts when more than the full allowance is removed', async function () {
            await shouldFail.reverting(
              this.token.decreaseAllowance(spender, approvedAmount.addn(1), { from: tokenSaleAccount })
            );
          });
        });
      }

      describe('when the sender has enough balance', function () {
        const amount = saleSupply;

        shouldDecreaseApproval(amount);
      });

      describe('when the sender does not have enough balance', function () {
        const amount = saleSupply.addn(1);

        shouldDecreaseApproval(amount);
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = saleSupply;
      const spender = ZERO_ADDRESS;

      it('reverts', async function () {
        await shouldFail.reverting(this.token.decreaseAllowance(spender, amount, { from: tokenSaleAccount }));
      });
    });
  });

  describe('increase allowance', function () {
    const amount = saleSupply;

    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        it('emits an approval event', async function () {
          const { logs } = await this.token.increaseAllowance(spender, amount, { from: tokenSaleAccount });

          expectEvent.inLogs(logs, 'Approval', {
            owner: tokenSaleAccount,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: tokenSaleAccount });

            (await this.token.allowance(tokenSaleAccount, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, new BN(1), { from: tokenSaleAccount });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: tokenSaleAccount });

            (await this.token.allowance(tokenSaleAccount, spender)).should.be.bignumber.equal(amount.addn(1));
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = saleSupply.addn(1);

        it('emits an approval event', async function () {
          const { logs } = await this.token.increaseAllowance(spender, amount, { from: tokenSaleAccount });

          expectEvent.inLogs(logs, 'Approval', {
            owner: tokenSaleAccount,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: tokenSaleAccount });

            (await this.token.allowance(tokenSaleAccount, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, new BN(1), { from: tokenSaleAccount });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: tokenSaleAccount });

            (await this.token.allowance(tokenSaleAccount, spender)).should.be.bignumber.equal(amount.addn(1));
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const spender = ZERO_ADDRESS;

      it('reverts', async function () {
        await shouldFail.reverting(this.token.increaseAllowance(spender, amount, { from: tokenSaleAccount }));
      });
    });
  });


  describe('approve', function () {
    testApprove(tokenSaleAccount, recipient, saleSupply, function (owner, spender, amount) {
      return this.token.approve(spender, amount, { from: owner });
    });
  });

 

  function testApprove (owner, spender, supply, approve) {
    describe('when the spender is not the zero address', function () {
      describe('when the sender has enough balance', function () {
        const amount = supply;

        it('emits an approval event', async function () {
          const { logs } = await approve.call(this, owner, spender, amount);

          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await approve.call(this, owner, spender, amount);

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await approve.call(this, owner, spender, new BN(1));
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await approve.call(this, owner, spender, amount);

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = supply.addn(1);

        it('emits an approval event', async function () {
          const { logs } = await approve.call(this, owner, spender, amount);

          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await approve.call(this, owner, spender, amount);

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await approve.call(this, owner, spender, new BN(1));
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await approve.call(this, owner, spender, amount);

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      it('reverts', async function () {
        await shouldFail.reverting(approve.call(this, owner, ZERO_ADDRESS, supply));
      });
    });
  }
});
