<br/>
<p align="center">
  <a href="https://github.com/deXOR0/kobar-server">
    <img src="https://media.discordapp.net/attachments/846612997836505088/1072917704018763786/Kobar.png?width=676&height=676" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Kobar Server</h3>

  <p align="center">
    Banyak menang, menang banyak
    <br/>
    <br/>
    <a href="https://gaul-lang.up.railway.app/">Learn more about Kobar and Gaul-lang here</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/NestJS-E0234E.svg?style=for-the-badge&logo=NestJS&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748.svg?style=for-the-badge&logo=Prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101.svg?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1.svg?style=for-the-badge&logo=PostgreSQL&logoColor=white" />
  <img src="https://img.shields.io/badge/Auth0-EB5424.svg?style=for-the-badge&logo=Auth0&logoColor=white" />
  <img src="https://img.shields.io/badge/Railway-0B0D0E.svg?style=for-the-badge&logo=Railway&logoColor=white" />
</p>

## Table Of Contents

* [About the Project](#about-the-project)
* [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Usage](#usage)
* [Authors](#authors)

## About The Project

![Screen Shot](https://media.discordapp.net/attachments/846612997836505088/1072918679668396052/Banner_Kobar.jpg?width=1440&height=360)

KOBAR is an app that helps users to know the extent of their understanding of basic programming by using Indonesian pseudocode that is easy to understand. Users can measure the extent of their abilities by playing with friends and random people!

Kobar has its own programming language called "Gaul-lang" which was designed to be easily understood by high-school students. It has Indonesian syntax and an easy-to-understand structure. 

This is the back end of Kobar. It handles user authentication with the help of an authentication service provider and handles the battle system as well as the Gaul-lang compilation.

## Built With

Kobar Server is built with the NestJS framework to handle API requests from Kobar's mobile clients. Kobar Server provided real-time communications between the server and client using WebSocket technology.

* [Node.js](https://nodejs.org/en/nes)
* [NestJS](https://nestjs.com/)
* [TypeScript](https://www.typescriptlang.org/)
* [Prisma](https://www.prisma.io/)
* [Socket.IO](https://socket.io/)
* [Auth0](https://auth0.com/)
* [PostgreSQL](https://www.postgresql.org/)

## Getting Started

To get started, clone this repository through your favorite Git client, or by using 
```
git clone https://github.com/deXOR0/kobar-server.git
```

### Prerequisites

Make sure you have these set up before you run the application
* Node.js
* npm
* postgresql@14
* [Auth0 account & project](https://auth0.com/docs/get-started)

### Installation

1. Install the dependencies
    ```
    npm install
    ```

2. Provision a PostgreSQL database and put the credentials in the .env file
    ```
    DATABASE_URL = 'Your PostgreSQL Database URL'
    ```

3. Put the Auth0 project domain and audience in the .env file
    ```
    AUTH0_DOMAIN = 'Your AUTH0 Domain'
    AUTH0_Audience = 'Your AUTH0 Audience'
    ```

4. Enter your API key in the .env file
    ```
    API_SECRET_KEY = 'Your API Key'
    ```

## Usage

To run the application you can start a local server with hot reloading enabled by entering this command
```
npm run start:dev
```

## Authors

* **Atyanta Awesa Pambharu** - *Back-end Developer* - [Atyanta Awesa Pambharu](https://github.com/deXOR0/) - *Built authentication, websocket communication, and battle systems*
* **Mohammad Salman Alfarisi** - *Gaul-lang Developer* - [Mohammad Salman Alfarisi](https://github.com/m-salman-a/) - *Built Gaul-lang implementation in JS*
