'use strict'

const { cart } = require("../models/cart.model")
const { BadRequestError, NotFoundError } = require("../core/error.response");
const { getProductById } = require("../models/repositories/product.repo");

/*
    KEY FEATURES: CART SERVICE
    - Add product to cart [user]
    - Reduce product quantity by one [user]
    - Increase product quantity by one [user]
    - Get cart [user]
    - Delete cart [user]
    - Delete product from cart [user]
 */

class CartService {

    /* START REPO CART */
    static async createUserCart({ userId, product }) {
        const query = {
            cart_userId: userId,
            cart_status: 'active'
        }
        const updateOrInsert = {
            $addToSet: {
                cart_products: product,
            }
        }, options = { upsert: true, new: true}

        return await cart.findOneAndUpdate(query, updateOrInsert, options)
    }

    static async updateUserCartQuantity({ userId, product }) {
        const { productId, quantity } = product
        const query = {
            cart_userId: userId,
            'cart_products.productId': productId,
            cart_status: 'active'
        }, updateSet = {
            $inc: {
                'cart_products.$.quantity': quantity
            }
        }, options = { upsert: true, new: true }

        return await cart.findOneAndUpdate(query, updateSet, options)
    }
    
    /* END REPO CART */

    static async addToCart({userId, product = {} }) {
        const userCart = await cart.findOne({
            cart_userId: userId
        })

        if (!userCart) {
            return await CartService.createUserCart({ userId, product })
        }

        // If user cart exists but product not in cart => add product to cart
        if (!userCart.cart_products.length) {
            userCart.cart_products = [product]
            return await userCart.save()
        }

        // If product already in cart => update quantity
        return await CartService.updateUserCartQuantity({ userId, product })
    }

    static async addToCartV2({userId, shop_order_ids = {} }) {
        const { productId, quantity, old_quantity } = shop_order_ids[0]?.item_products[0]
        // Check if the cart exists for the user
        const foundProduct = await getProductById(productId)
        if (!foundProduct) throw new NotFoundError("Product not found")
        if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) 
            throw new NotFoundError("Product not belong to this shop")
        if (quantity === 0) {

        }

        return await CartService.updateUserCartQuantity({ userId, product: {
            productId,
            quantity: quantity - old_quantity,
        } })
    }

    static async deleteUserCart({ userId, productId }) {
        const query = { cart_userId: userId, cart_status: 'active' }
        const updateSet = {
            $pull: {
                cart_products: { productId }
            }
        }

        const deleteCart = await cart.updateOne(query, updateSet)
        return deleteCart
    }

    static async getListUserCart({ userId }) {
        return await cart.findOne({
            cart_userId: +userId,
        }).lean()
    }
}

module.exports = CartService