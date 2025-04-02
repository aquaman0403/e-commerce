'use strict'

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Discount';
const COLLECTION_NAME = 'discounts';

const discountSchema = new Schema({
    discount_name: {
        type: String,
        required: true,
    },
    discount_description: {
        type: String,
        required: true,
    },
    discount_type: {
        type: String,
        default: "fixed_amount", // fixed_amount or percentage
    },
    discount_value: {
        type: Number, // Giá trị giảm giá, có thể là số tiền cố định hoặc phần trăm
        required: true,
    },
    discount_code: {
        type: String,
        required: true,
    },
    discount_start_date: {
        type: Date,
        required: true,
    },
    discount_end_date: {
        type: Date,
        required: true
    },
    discount_max_value: {
        type: Number,
        required: true,
    },
    discount_max_uses: {
        type: Number, // Số lượng tối đa mà mã giảm giá có thể được sử dụng
        required: true,
    },
    discount_uses_count: {
        type: Number, // Số lượng đã sử dụng
        required: true,
    },
    discount_users_used: {
        type: Array, // Danh sách người dùng đã sử dụng mã giảm giá
        default: []
    },
    discount_max_uses_per_user: {
        type: Number, // Số lượng tối đa mà mỗi người dùng có thể sử dụng mã giảm giá
        required: true,
    },
    discount_min_order_value: {
        type: Number, // Giá trị đơn hàng tối thiểu để áp dụng mã giảm giá
        required: true,
    },
    discount_shopId: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
    },
    discount_is_active: {
        type: Boolean, // Trạng thái hoạt động của mã giảm giá
        default: true, 
    },
    discount_applies_to: {
        type: String,
        required: true,
        enum: ['all', 'specific'],
    },
    discount_product_ids: {
        type: Array, // Danh sách sản phẩm áp dụng mã giảm giá
        default: []
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

//Export the model
module.exports = {
    discount: model(DOCUMENT_NAME, discountSchema),
}