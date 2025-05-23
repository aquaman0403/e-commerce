'use strict'

const apiKeyModel = require("../models/apiKey.model")
const crypto = require('crypto')

const findById = async ( key ) => {
    
    const objKey = await apiKeyModel.findOne({ key, status: true }).lean()
    return objKey
}

module.exports = {
    findById
}