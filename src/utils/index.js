'use strict'

const _ = require('lodash')

const getInfoData = ({ fields = [], object = {} }) => {
    return _.pick(object, fields)
}

const getSelectData = (select = []) => {
    return Object.fromEntries(select.map(el => [el, 1]));
}

const getUnSelectData = (select = []) => {
    return Object.fromEntries(select.map(el => [el, 0]));
}

module.exports = {
    getInfoData,
    getSelectData,
    getUnSelectData
}