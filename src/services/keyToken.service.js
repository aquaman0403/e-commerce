'use strict'

const { update } = require('lodash');
const keyTokenModel = require('../models/token.model');

class KeyTokenService {
    static createKeyToken = async ({ userId, publicKey, privateKey, refreshToken}) => {
        try {
            // level 0
            // const tokens = await keyTokenModel.create({
            //     user: userId,
            //     publicKey,
            //     privateKey,
            // })

            // return tokens ? tokens.publicKey : null;

            const filter = { user: userId };
            const update = { publicKey, privateKey, refreshTokenUsed: [], refreshToken };
            const options = { upsert: true, new: true };
            const tokens = await keyTokenModel.findOneAndUpdate(filter, update, options)

            return token ? tokens.publicKey : null;
        } catch (error) {
            return error;
        }
    }
}

module.exports = KeyTokenService;