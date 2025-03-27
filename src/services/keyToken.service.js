"use strict";

const keyTokenModel = require("../models/token.model");
const { Types } = require("mongoose");

class KeyTokenService {
  static createKeyToken = async ({
    userId,
    publicKey,
    privateKey,
    refreshToken,
  }) => {
    try {
      const filter = { user: userId };
      const update = {
        publicKey,
        privateKey,
        refreshTokenUsed: [],
        refreshToken,
      };
      const options = { upsert: true, new: true };
      const tokens = await keyTokenModel.findOneAndUpdate(
        filter,
        update,
        options
      );

      return token ? tokens.publicKey : null;
    } catch (error) {
      return error;
    }
  };

  static findByUserId = async (userId) => {
    return await keyTokenModel
      .findOne({ user: new Types.ObjectId(userId) });
  };

  static removeTokenById = async ({ id }) => {
    const result = await keyTokenModel.deleteOne({
      _id: new Types.ObjectId(id),
    });
    return result;
  };

  static findByRefreshTokenUsed = async (refreshToken) => {
    return await keyTokenModel.findOne({ refreshTokenUsed: refreshToken }).lean();
  }

  static findByRefreshToken = async (refreshToken) => {
    return await keyTokenModel.findOne({ refreshToken });
  };

  static deleteKeyById = async (userId) => {
    return await keyTokenModel.deleteMany({ user: new Types.ObjectId(userId) });
  };
}

module.exports = KeyTokenService;
