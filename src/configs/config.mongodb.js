"use strict";

const e = require("express");

const dev = {
  app: {
    port: process.env.DEV_APP_PORT,
  },
  db: {
    uri: process.env.MONGODB_URL,
  },
};

const pro = {
  app: {
    port: process.env.PRO_APP_PORT,
  },
  db: {
    uri: process.env.MONGODB_URL,
  },
};

const config = { dev, pro };
const env = process.env.NODE_ENV || "dev";

console.log("🌍 Running in environment:", env);
module.exports = config[env];
