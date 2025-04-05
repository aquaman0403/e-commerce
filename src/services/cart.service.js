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
        };
        const updateOrInsert = {
            $setOnInsert: { // Chỉ set khi tạo mới
                cart_products: [product]
            }
        };
        const options = { upsert: true, new: true };

        return await cart.findOneAndUpdate(query, updateOrInsert, options);
    }

    static async updateUserCartQuantity({ userId, product }) {
        const { productId, quantity } = product;
        
        // Kiểm tra giỏ hàng tồn tại
        const userCart = await cart.findOne({ 
            cart_userId: userId,
            cart_status: 'active'
        });
        
        if (!userCart) {
            return await CartService.createUserCart({ userId, product });
        }

        // Kiểm tra sản phẩm đã có trong giỏ chưa
        const productExists = userCart.cart_products.some(p => p.productId === productId);
        
        if (productExists) {
            // Cập nhật số lượng nếu sản phẩm đã tồn tại
            return await cart.findOneAndUpdate(
                { 
                    cart_userId: userId,
                    'cart_products.productId': productId,
                    cart_status: 'active'
                },
                { $inc: { 'cart_products.$.quantity': quantity } },
                { new: true }
            );
        } else {
            // Thêm sản phẩm mới nếu chưa tồn tại
            return await cart.findOneAndUpdate(
                { 
                    cart_userId: userId,
                    cart_status: 'active'
                },
                { $addToSet: { cart_products: product } },
                { new: true }
            );
        }
    }
    
    /* END REPO CART */

    static async addToCart({ userId, product = {} }) {
        // Kiểm tra sản phẩm hợp lệ
        if (!product.productId || !product.shopId) {
            throw new BadRequestError('Invalid product data');
        }

        const foundProduct = await getProductById(product.productId);
        if (!foundProduct) throw new NotFoundError("Product not found");
        if (foundProduct.product_shop.toString() !== product.shopId) {
            throw new BadRequestError("Product does not belong to the shop");
        }

        return await CartService.updateUserCartQuantity({ userId, product });
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