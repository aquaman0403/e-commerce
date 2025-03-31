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

const removeUndefineObject = obj => {
    Object.keys(obj).forEach(key => {
        if (obj[key] == null) delete obj[key]
    })

    return obj;
}

const updateNestedObjectParser = obj => {
    console.log(`[1]::`,obj)
    const final = {};
    Object.keys(obj).forEach(key => {
        console.log(`[3]::`, key)
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const response = updateNestedObjectParser(obj[key]);
            Object.keys(response).forEach(res => {
                console.log(`[4]::`, res)
                final[`${key}.${res}`] = response[res];
            })
        } else {
            final[key] = obj[key];
        }
    })
    console.log(`[2]::`,final)
    return final;
}

module.exports = {
    getInfoData,
    getSelectData,
    getUnSelectData,
    removeUndefineObject,
    updateNestedObjectParser
}