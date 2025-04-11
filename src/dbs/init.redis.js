'use strict'
const redis = require('redis')
const { RedisErrorResponse } = require('../core/error.response')

let client = {}, statusConnectRedis = {
    CONNECT: 'connect',
    END: 'end',
    RECONNECT: 'reconnecting',
    ERROR: 'error',
}, connectionTimeout

const REDIS_CONNECT_TIMEOUT = 10000 // 10s
const REDIS_CONNECT_MESSAGE = {
    code: -99,
    message: {
        vn: "Redis lỗi kết nối",
        en: "Redis connection error"
    }
}

const handleTimeoutError = () => {
    connectionTimeout = setTimeout(() => {
        throw new RedisErrorResponse({
            message: REDIS_CONNECT_MESSAGE.message.vn,
            statusCode: REDIS_CONNECT_MESSAGE.code
        })
    }, REDIS_CONNECT_TIMEOUT)
}

const handleEventConnection = ({
    connectionRedis
}) => {
    connectionRedis.on(statusConnectRedis.CONNECT, () => {
        console.log(`connectionRedis - Connection status: connected`)
        clearTimeout(connectionTimeout)
    })

    connectionRedis.on(statusConnectRedis.END, () => {
        console.log(`connectionRedis - Connection status: disconnected`)
        // Connect retry
        handleTimeoutError()
    })

    connectionRedis.on(statusConnectRedis.RECONNECT, () => {
        console.log(`connectionRedis - Connection status: reconnecting`)
        clearTimeout(connectionTimeout)
    })

    connectionRedis.on(statusConnectRedis.ERROR, (err) => {
        console.log(`connectionRedis - Connection status: error ${err}`)
        // Connect retry
        handleTimeoutError()
    })
}

const initRedis = () => {
    const instanceRedis = redis.createClient()
    client.instanceConnect = instanceRedis
    handleEventConnection({
        connectionRedis: instanceRedis
    })
}

const getRedis = () => client

const closeRedis = async () => {
    try {
        if (client.instanceConnect) {
            await client.instanceConnect.quit()
            console.log('connectionRedis - Connection closed successfully')
            client.instanceConnect = null
            clearTimeout(connectionTimeout)
        }
    } catch (err) {
        console.error(`connectionRedis - Error closing connection: ${err}`)
        throw new RedisErrorResponse({
            message: 'Redis closing connection error',
            statusCode: -98
        })
    }
}

module.exports = {
    initRedis,
    getRedis,
    closeRedis
}