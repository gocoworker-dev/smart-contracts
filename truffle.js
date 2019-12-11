require('dotenv').config();

const HDWalletProvider = require('truffle-hdwallet-provider');


module.exports = {
  compilers: {
    solc: {
      version: '0.5.13'
    }
  },
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
      
    },
    rinkeby: {
      provider: new HDWalletProvider(process.env.MNEMONIC, 'https://rinkeby.infura.io/' + process.env.INFURA_API_KEY, 0, 5),
      gas: 4700000,
      network_id: 4,
      skipDryRun: true
    },
    ropsten: {
      provider: new HDWalletProvider(process.env.MNEMONIC, 'https://ropsten.infura.io/' + process.env.INFURA_API_KEY, 0, 5),
      gas: 4700000,
      network_id: 3,
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
