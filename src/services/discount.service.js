'use strict'

const { BadRequestError, NotFoundError } = require('../core/error.response')
const {discount} = require('../models/discount.model')
const { convertToObjectIdMongodb } = require('../utils')
const { findAllProducts } = require('../models/repositories/product.repo')
const { 
    findAllDiscountCodesUnSelect, 
    findAllDiscountCodesSelect ,
    checkDiscountExsits,
    updateDiscountById
} = require('../models/repositories/discount.repo')
const { removeUndefineObject, updateNestedObjectParser } = require("../utils");

/*
    Discount Service
    1. Generator discount code [Shop|Admin]
    2. Get Discount amount [User]
    3. Get all discount codes [User|Shop]
    4. Verify discount code [User]
    5. Delete discount code [Shop|Admin]
    6. Cancel discount [User]
 */

class DiscountService {
    
    static async createDiscountCode(payload) {
        const {
            code, start_date, end_date, is_active, shopId, users_used, value,
            min_order_value, product_ids, applies_to, name, description, 
            type, max_value, max_uses, uses_count, max_uses_per_user
        } = payload
        
        if (new Date(start_date) >= new Date(end_date)) {
            throw new BadRequestError('Start date must be before end date')
        }
        
        // Create index for discount code
        const foundDiscount = await discount.findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongodb(shopId),
        }).lean()

        if (foundDiscount && foundDiscount.discount_is_active) {
            throw new BadRequestError('Discount code already exists')
        }
        
        const newDiscount = await discount.create({
            discount_name: name,
            discount_description: description,
            discount_type: type,
            discount_code: code,
            discount_value: value,
            discount_min_order_value: min_order_value || 0,
            discount_max_value: max_value,
            discount_start_date: new Date(start_date),
            discount_end_date: new Date(end_date),
            discount_max_uses: max_uses,
            discount_uses_count: uses_count,
            discount_users_used: users_used,
            discount_shopId: shopId,
            discount_max_uses_per_user: max_uses_per_user,
            discount_is_active: is_active,
            discount_applies_to: applies_to,
            discount_product_ids: applies_to === 'all' ? [] : product_ids
        })
        
        return newDiscount
    }

    static async updateDiscountCode(discountId, payload) {
        // Parse and clean the payload
        const updateData = updateNestedObjectParser(payload);
        const cleanedData = removeUndefineObject(updateData);

        // Update the discount code in the database
        const updatedDiscount = await updateDiscountById({
            discountId,
            bodyUpdate: cleanedData,
        });

        if (!updatedDiscount) {
            throw new BadRequestError("Failed to update discount code");
        }

        return updatedDiscount;
    }

    static async getAllDiscountCodesWithProduct({
        code, shopId, limit, page
    }) {
        const fountDiscount = await discount.findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongodb(shopId),
        }).lean()

        if (!fountDiscount || !fountDiscount.discount_is_active) {
            throw new NotFoundError('Discount code not found')
        }

        const { discount_applies_to, discount_product_ids } = fountDiscount
        let products
        if (discount_applies_to === 'all') {
            // Get all products in shop
            products = await findAllProducts({
                filter: {
                    product_shop: convertToObjectIdMongodb(shopId),
                    isPublished: true,
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['product_name'],
            })
        }
        if (discount_applies_to === 'specific') {
            // Get products by id
            products = await findAllProducts({
                filter: {
                    _id: { $in: discount_product_ids },
                    isPublished: true,
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['product_name'],
            })
        }
    }

    static async getAllDiscountCodesByShop({
        limit, page, 
        shopId
    }) {
        const discounts = await findAllDiscountCodesUnSelect({
            limit: + limit,
            page: + page,
            filter: {
                discount_shopId: convertToObjectIdMongodb(shopId),
                discount_is_active: true,
            },
            unSelect: ['__v', 'discount_shopId'],
            model: discount,
        })

        return discounts
    }

    static async getDiscountAmount({ codeId, userId, shopId, products }) {
        const foundDiscount = await checkDiscountExsits({
            model: discount,
            filter: {
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongodb(shopId),
            }
        })

        if (!foundDiscount) {
            throw new NotFoundError('Discount code not found')
        }
        const {
            discount_is_active,
            discount_max_uses,
            discount_min_order_value,
            discount_users_used,
            discount_value,
            discount_max_uses_per_user,
            discount_type,
        } = foundDiscount

        if (!discount_is_active) throw new BadRequestError('Discount code has expired')
        if (!discount_max_uses) throw new BadRequestError('Discount code are out')

        let totalOrder = 0
        if (discount_min_order_value > 0) {
            totalOrder = products.reduce((acc, product) => {
                return acc + (product.quantity * product.price)
            }, 0)

            if (totalOrder < discount_min_order_value) {
                throw new BadRequestError(`Discount requires minimum order value of ${discount_min_order_value}`)
            }
        }

        if (discount_max_uses_per_user > 0) {
            if (!discount_users_used[userId]) {
                // Nếu user chưa từng sử dụng, khởi tạo số lần sử dụng là 1
                discount_users_used[userId] = 1;
            } else {
                if (discount_users_used[userId] >= discount_max_uses_per_user) {
                    throw new BadRequestError(`You have reached the maximum usage limit for this discount code.`);
                }
                // Tăng số lần sử dụng
                discount_users_used[userId] += 1;
            }
        }
        
        const amount = discount_type === 'fixed_amount' ? discount_value : (discount_value / 100) * totalOrder

        return {
            totalOrder,
            discount: amount,
            totalPrice: totalOrder - amount,
        }
    }

    static async deleteDiscountCode({shopId, codeId}) {
        const deleted = await discount.findOneAndDelete({
            discount_code: codeId,
            discount_shopId: convertToObjectIdMongodb(shopId),
        })

        return deleted
    }

    static async cancelDiscountCode({shopId, codeId, userId}) {
        const foundDiscount = await checkDiscountExsits({
            model: discount,
            filter: {
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongodb(shopId),
            }
        })

        if (!foundDiscount) {
            throw new NotFoundError('Discount code not found')
        }

        const result = await discount.findByIdAndUpdate(foundDiscount._id, {
            $pull: {
                discount_users_used: userId
            },
            $inc: {
                discount_max_uses: 1,
                discount_uses_count: -1,
            }
        })

        return result
    }
}

module.exports = DiscountService;