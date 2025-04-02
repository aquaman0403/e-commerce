'use strict'

const {getUnSelectData, getSelectData} = require('../../utils/index')
const { discount } = require("../../models/discount.model");

const findAllDiscountCodesUnSelect = async ({
    limit = 50, page = 1, sort = 'ctime', filter, unSelect, model
}) => {
    const skip = (page - 1) * limit
    const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 }
    const documents = await model.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select(getUnSelectData(unSelect))
        .lean()
    
    return documents
}

const findAllDiscountCodesSelect = async ({
    limit = 50, page = 1, sort = 'ctime', filter, select, model
}) => {
    const skip = (page - 1) * limit
    const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 }
    const documents = await model.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select(getSelectData(select))
        .lean()
    
    return documents
}

const checkDiscountExsits = async ({model, filter}) => {
    return await model.findOne(filter).lean()
}

const updateDiscountById = async ({ discountId, bodyUpdate, isNew = true }) => {
    return await discount.findByIdAndUpdate(discountId, bodyUpdate, {
        new: isNew,
    });
};

module.exports = {
    findAllDiscountCodesUnSelect,
    findAllDiscountCodesSelect,
    checkDiscountExsits,
    updateDiscountById
}