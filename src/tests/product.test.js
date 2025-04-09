const RediPubSubService = require("../services/redisPubSub.service");

class ProductServiceTest {
    purchaseProduct(productId, quantity) {
        const order = {
            productId,
            quantity
        };
        // Publish chuỗi JSON
        RediPubSubService.publish('purchase_events', JSON.stringify(order));
    }
}

module.exports = new ProductServiceTest();