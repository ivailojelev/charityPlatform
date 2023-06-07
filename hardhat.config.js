require("@nomicfoundation/hardhat-toolbox");
require('./tasks');
require('dotenv').config({ path: __dirname + '/.env' })
/** @type import('hardhat/config').HardhatUserConfig */

const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
module.exports = {
  solidity: "0.8.17",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/BeFNsEtdsS5UXW3ypRhZdNNsdaGgirC0",
      accounts: [SEPOLIA_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
