require('dotenv').config();

const HDWalletProvider = require('truffle-hdwallet-provider');


module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 9545,
      network_id: '*', // eslint-disable-line camelcase
    },
    rinkeby: {
      provider: new HDWalletProvider(process.env.MNEMONIC, 'https://rinkeby.infura.io/' + process.env.INFURA_API_KEY),
      gas: 4700000,
      network_id: 4,
      skipDryRun: true
    },
    testrpc: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
  },
  migrations_directory: './migrations',
};
