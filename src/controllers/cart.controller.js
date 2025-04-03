'use strict'

const CartService = require('../services/cart.service')
const { SuccessResponse } = require('../core/success.response')

class CartController {
    addToCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Add product to cart successfully',
            metadata: await CartService.addToCart(req.body)
        }).send(res)
    }

    updateCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update product in cart successfully',
            metadata: await CartService.addToCartV2(req.body)
        }).send(res)
    }

    deleteCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete cart successfully',
            metadata: await CartService.deleteUserCart(req.body)
        }).send(res)
    }

    getListCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list cart successfully',
            metadata: await CartService.getListUserCart(req.query)
        }).send(res)
    }
}

module.exports = new CartController()