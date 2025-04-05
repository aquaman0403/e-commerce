'use strict'

const { cart } = require('../../models/cart.model')
const { convertToObjectIdMongodb } = require('../../utils')

const findCartById = async (cartId) => {
    const conv = convertToObjectIdMongodb(cartId);
    return await cart.findOne({_id: conv, cart_status: 'active'}).lean()
}

module.exports = {
    findCartById
}
