const fs = require('fs');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    develop: {
      port: 8545
    }
  },

  // compilers: {
  //   solc: {
  //     version: '0.5.16',
  //     optimizer: {
  //       enabled: true,
  //       runs: 200
  //     }
  //   }
  // }
  compilers: {
    solc: {
      version: "./node_modules/solc", // 指向本地 solcjs 模块
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }



};
