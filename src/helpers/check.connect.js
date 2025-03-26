"use strict";
const mongoose = require("mongoose");
const os = require("os");
const process = require("process");
const { setInterval } = require("timers/promises");
const _SECONDS = 5000;

// count connection
const countConnect = () => {
  const numConnection = mongoose.connections.length;
  console.log(`Number of connections: ${numConnection}`);
};

// check over load
const checkOverLoad = () => {
  setInterval(() => {
    const numConnection = mongoose.connections.length;
    const numCore = os.cpus().length;
    const memmoryUsage = process.memoryUsage().rss;
    // Example maximum number of connections based on number of cores
    const maxConnection = numCore * 5;

    console.log(`Number of connections: ${numConnection}`);
    console.log(`Memory usage: ${memmoryUsage / 1024 / 1024} MB`);

    if (numConnection > maxConnection) {
      console.log(`Overload! Number of connections: ${numConnection}`);
    }
  }, _SECONDS); // Monitor every 5 seconds
};

module.exports = { countConnect, checkOverLoad };
