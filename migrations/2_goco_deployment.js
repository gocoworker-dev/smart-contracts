const GOCOToken = artifacts.require('./GOCOToken.sol');

module.exports = function (deployer) {
  deployer.deploy(GOCOToken, process.env.FOUNDER_WALLET, process.env.TOKENSALE_WALLET, process.env.REWARDPOOL_WALLET);
};
