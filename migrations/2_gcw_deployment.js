const GCWToken = artifacts.require('./GCWToken.sol');

module.exports = function (deployer) {
  deployer.deploy(GCWToken, "0xEE19e971110d8BCDf22f7f42afc8156bf9826Bbc", "0x36e6f449DE75E29DDbeD6c2568b3999d306593d2", "0x2270538938E3d17ECea578676e3Fc9c241963216");
};
