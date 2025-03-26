"use strict";

const shopModel = require("../models/shop.model");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const {
  BadRequestError,
  AuthFailureError,
  ForBiddenError,
} = require("../core/error.response");
const { findByEmail } = require("./shop.service");

const RoleShop = {
  SHOP: "SHOP",
  WRITER: "WRITER",
  EDITOR: "EDITOR",
  ADMIN: "ADMIN",
};

class AccessService {
  static handlerRefreshToken = async (refreshToken) => {
    // check xem token nay da duoc su dung hay chua
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(
      refreshToken
    );
    // neu co
    if (foundToken) {
      // decode
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      );
      console.log({ userId, email });
      // xoa tat ca token trong keyStore
      await KeyTokenService.deleteKeyById(userId);
      throw new ForBiddenError("Something wrong happen! Please re-login");
    }

    // neu chua
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);
    if (!holderToken) {
      throw new AuthFailureError("Token not found");
    }

    // verify token
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );
    // check user
    const foundShop = await findByEmail({email});
    if (!foundShop) {
      throw new AuthFailureError("Shop not registered");
    }

    // create 1 cap moi
    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey
    );

    // update token
    await holderToken.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokenUsed: refreshToken // da duoc su dung de lay token moi
      }
    })

    return {
      user: { userId, email },
      tokens,
    }
  };

  static logout = async (keyStore) => {
    const delKey = await KeyTokenService.removeTokenById({ id: keyStore._id });
    console.log(`delKey::`, delKey);
    return delKey;
  };

  /*
    1 - check email in dbs
    2 - match password
    3 - create access token, refresh token and save
    4 - generate token
    5 - get data return login
   */

  static login = async ({ email, password, refreshToken = null }) => {
    // step 1: check email exist
    const foundShop = await findByEmail({ email });
    if (!foundShop) {
      throw new BadRequestError("Error: Shop not registered");
    }

    // step 2: match password
    const match = bcrypt.compare(password, foundShop.password);
    if (!match) {
      throw new AuthFailureError("Error: Password not match");
    }

    // step 3: create access token, refresh token and save
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    // step 4: generate token
    const { _id: userId } = foundShop;
    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
      userId,
    });

    return {
      shop: getInfoData({
        fields: ["_id", "name", "email"],
        object: foundShop,
      }),
      tokens,
    };
  };

  static signUp = async ({ name, email, password }) => {
    // step 1: check email exist
    const holderShop = await shopModel.findOne({ email }).lean();
    if (holderShop) {
      throw new BadRequestError("Error: Shop already exists");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newShop = await shopModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.SHOP],
    });

    if (newShop) {
      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      console.log({ privateKey, publicKey }); // save collection keyToken

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newShop._id,
        publicKey,
        privateKey,
      });

      if (!keyStore) {
        return {
          code: "xxxx",
          message: "keyStore error",
        };
      }
      // created token pair
      const tokens = await createTokenPair(
        { userId: newShop._id, email },
        publicKey,
        privateKey
      );
      console.log(`Create Token Success::`, tokens);

      return {
        code: 201,
        metadata: {
          shop: getInfoData({
            fields: ["_id", "name", "email"],
            object: newShop,
          }),
          tokens,
        },
      };
    }
    return {
      code: 200,
      metadata: null,
    };
  };
}

module.exports = AccessService;
