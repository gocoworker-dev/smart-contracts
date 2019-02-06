
const GCWToken = artifacts.require('./GCWToken.sol');
const GCWPreSale = artifacts.require('./GCWPreSale.sol');

// var openingTime = Date.parse("09/30/2019 12:00:00");

module.exports = function (deployer) {
  deployer.deploy(GCWPreSale, Date.now(), "0x36e6f449DE75E29DDbeD6c2568b3999d306593d2", "0x2270538938E3d17ECea578676e3Fc9c241963216", GCWToken.address);
};
