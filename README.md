# APS1050-2025F-Petshop-Project

APS1050F: Blockchain Technologies and Cryptocurrencies 2025 Fall Project at the University of Toronto \
The repository contains all the source code and documentations for Course Project written by 4 students \
***A PDF verion of book "Broken Money: Why Our Financial System is Failing Us and How We Can Make it Better" By Lyn Alden is also included in the repository for in-class quiz.***

**Please follow the academic integrity at the University of Toronto.**

## Introduction 
Our DApp is an enhanced version of the classic Pet Shop DApp ([Pete's Pet Shop](https://archive.trufflesuite.com/guides/pet-shop/)) decentralized application, built on Ethereum using Solidity, Web3.js, and a fully on-chain smart contract architecture. It allows users to view, adopt, and interact with pets while ensuring transparency, immutability, and trust through blockchain technology. For our DApp, **7 features have been implemented to compromise the team size of 4 people after discussion with instructors**. All 7 features enrich both the front-end user experience and the back-end smart contract logic, making the DApp more interactive and intuitive. These improvements create a more dynamic, user-driven, and functional platform for decentralized pet adoption.

## Required package and Versioning
| Package             | Version         |
|---------------------|------------------|
| Node.js             | v12.13.0        |
| lite-server         | v2.6.2         |
| Solidity            | v0.5.16         |
| web3.js             | v1.2.1          |
| Truffle             | v5.1.10         |
| Ganache             | v2.7.1          |
| Front-End Framework | jQuery & Bootstrap |

## Installation and compilation

1. Install Truffle globally.
    ```javascript
    npm install -g truffle
    ```

2. Compile the project.
    ```javascript
    truffle compile
    ```

3. Run the development console and migrate the contract.
    ```javascript
    truffle migrate -- reset
    ```

4. Run the `liteserver` development server 
    ```javascript
    // Serves the front-end on http://localhost:3000
    npm run dev
    ```
## Feature Implementation 
1. a way of adding/registering pets (and their photos url), for a fee
2. a way to restrict the hours of operation of the PetShop DApp to business hours (9AM - 9PM EST)
3. a way of filtering*** for a list of pets (available pets not adopted already) of a specific breed, age and location etc.
4. a way of liking and unliking a pet in the Petshop, for a fee
5. a way of recording and showing the pets liked by the  user
6. a way of filtering*** for a list of pets (already adopted pets) of a specific breed, age and location etc.
7. a way of donating ether to the petshop transferred from Web3Basics SendMeEther, where only the petshop owner can withdraw ether

## Conclusion
Overall, the deployment of seven features significantly strengthens both the smart-contract layer and the front-end interface, resulting in a more transparent, secure, and user-driven decentralized pet adoption experience.
