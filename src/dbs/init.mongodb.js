"use strict";

const mongoose = require("mongoose");
const {
  db: { uri },
} = require("../configs/config.mongodb");
const connectString = `${uri}`;

const { countConnect } = require("../helpers/check.connect");

class Database {
  constructor() {
    this.connect();
  }

  // connect
  connect(type = "mongodb") {
    if (1 === 1) {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });
    }

    mongoose
      .connect(connectString)
      .then((_) => console.log(`Connected to MongoDB PRO`, countConnect()))
      .catch((err) => console.error("Error connect!"));

    mongoose.connection.on("connected", () => {
      console.log("Connected to DB:", mongoose.connection.name);
    });
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb;
