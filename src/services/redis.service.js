'use strict'

const redis = require('redis')
const { promisify } = require('util')
const { reservationInventory } = require('../models/repositories/inventory.repo')

const { getRedis } = require('../dbs/init.redis')

const { instanceConnect: redisClient } = getRedis()


const pexpire = promisify(redisClient.pExpire).bind(redisClient)
const setnxAsync = promisify(redisClient.setNX).bind(redisClient)

const acquireLock = async (productId, quantity, cartId) => {
    const key = `lock_v2025${productId}`
    const retryTimes = 10
    const expireTime = 3000

    for (let i = 0; i < retryTimes; i++) {
        // Tao 1 key, ai nam giu thi duoc vao thanh toan
        const result = await setnxAsync(key, expireTime)
        console.log(`result::`, result)
        if (result === 1) {
            // Thao tac voi inventory
            const isReservation = await reservationInventory({
                productId, quantity, cartId
            })

            if (isReservation.modifiedCount) {
                await pexpire(key, expireTime)
                return key
            }
            return null
        } else {
            await new Promise((resolve) => setTimeout(resolve, 50))
        }
    }
} 

const releaseLock = async keyLock => {
    const delAsyncKey = promisify(redisClient.del).bind(redisClient)
    return await delAsyncKey(keyLock)
}

module.exports = {
    acquireLock,
    releaseLock
}