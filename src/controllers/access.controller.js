"use strict";

const AccessService = require("../services/access.service");

const { OK, CREATED } = require("../core/success.response");

class AccessController {
  signUp = async (req, res, next) => {
    new CREATED({
      message: "Register successfully",
      metadata: await AccessService.signUp(req.body),
      options: {
        limit: 10
      }
    }).send(res);
  };
}

module.exports = new AccessController();
