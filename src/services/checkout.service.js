'use strict'

const { findCartById } = require('../models/repositories/cart.repo')
const { checkProductByServer } = require('../models/repositories/product.repo')
const { BadRequestError } = require('../core/error.response')
const { getDiscountAmount } = require('./discount.service')
const { acquireLock, releaseLock } = require('./redis.service')
const { order } = require("../models/order.model")

class CheckoutService {

    static async checkoutReview({
        cartId, userId, shop_order_ids = []
    }) {
        const foundCart = await findCartById(cartId)
        if (!foundCart) throw new BadRequestError('Cart not found!')

        const checkoutOrder = {
            totalPrice: 0,
            feeShip: 0,
            totalDiscount: 0,
            totalCheckout: 0,
        }
        const shop_order_ids_new = []
        for (let i = 0; i < shop_order_ids.length; i++) {
            const { shopId, shop_discounts = [], item_products = [] } = shop_order_ids[i]
            const checkProductServer = await checkProductByServer(item_products)
            console.log(`checkProductServer::`, checkProductServer)
            if (!checkProductServer[0]) throw new BadRequestError('Order wrong!')
            
            const checkoutPrice = checkProductServer.reduce((acc, product) => {
                return acc + (product.quantity)*product.price
            }, 0)

            checkoutOrder.totalPrice += checkoutPrice

            const itemCheckout = {
                shopId,
                shop_discounts,
                priceRaw: checkoutPrice, 
                priceApplyDiscount: checkoutPrice,
                item_products: checkProductServer
            }

            if (shop_discounts.length > 0) {
                const { totalPrice = 0, discount = 0 } = await getDiscountAmount({
                    codeId: shop_discounts[0].codeId,
                    userId,
                    shopId,
                    products: checkProductServer
                })
                
                // Tổng số discount
                checkoutOrder.totalDiscount += discount

                if (discount > 0) {
                    itemCheckout.priceApplyDiscount = checkoutPrice - discount
                }
            }
            
            // Tổng thanh toán cuối cùng
            checkoutOrder.totalCheckout += itemCheckout.priceApplyDiscount
            shop_order_ids_new.push(itemCheckout)
        }

        return {
            shop_order_ids,
            shop_order_ids_new,
            checkoutOrder
        }
    }

    static async orderByUser({
        shop_order_ids,
        cartId,
        userId,
        user_address = {},
        user_payment = {}
    }) {
        const { shop_order_ids_new, checkoutOrder } = await CheckoutService.checkoutReview({
            cartId,
            userId,
            shop_order_ids: shop_order_ids
        })

        // Check lai mot lan nua xem co vuot so luong ton kho hay khong?
        const products = shop_order_ids_new.flatMap(order => order.item_products)
        const acquireProducts = []
        for (let i = 0; i < products.length; i++) {
            const { productId, quantity } = products[i]
            const keyLock = await acquireLock(productId, quantity, cartId)
            acquireProducts.push(keyLock ? true : false)
            if (keyLock) {
                await releaseLock(keyLock)
            }
        }

        // Check: neu co 1 san pham het hang trong kho
        if (acquireProducts.includes(false)) {
            throw new BadRequestError('Mot so san pham da duoc cap nhat. Vui long quay lai gio hang!')
        }

        const newOrder = await order.create({
            order_userId: userId,
            order_checkout: checkoutOrder,
            order_shipping: user_address,
            order_payment: user_payment,
            order_products: shop_order_ids_new
        })

        // New insert thanh cong thi remove product co trong gio hang
        if (newOrder) {
            // Remove products in cart
        }

        return newOrder
    }

    static async getOrdersByUser() {

    }

    static async getOneOrderByUser() {

    }

    static async cancelOrderByUser() {

    }

    static async updateOrderStatus() { // Admin || Shop

    }
}

module.exports = CheckoutService