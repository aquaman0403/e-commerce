const RediPubSubService = require("../services/redisPubSub.service");

class InventoryServiceTest {
    constructor() {
        // Sửa callback chỉ nhận message
        RediPubSubService.subscribe('purchase_events', (message) => {
            console.log("Received message: ", message);
            // Parse chuỗi JSON thành object
            const order = JSON.parse(message);
            InventoryServiceTest.updateInventory(order.productId, order.quantity);
        });
    }

    static updateInventory(productId, quantity) {
        console.log(`[0001]: Updated Inventory ${productId} with quantity ${quantity}`);
    }
}

module.exports = new InventoryServiceTest();