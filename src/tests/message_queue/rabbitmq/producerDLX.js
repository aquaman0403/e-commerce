const amqp = require('amqplib');

const messages = "Xin chào, tôi là một tin nhắn RabbitMQ!";

// const log = console.log

// console.log = function () {
//     log.apply(console, [new Date()].concat(arguments))
// }

const runProducer = async () => {
    try {
        const connection = await amqp.connect('amqp://guest:12345@localhost');
        const channel = await connection.createChannel();
        
        const notificationExchange = 'notificationExchange';
        const notiQueueName = 'notificationQueueProcess';
        const notificationExchangeDLX = 'notificationExchangeDLX';
        const notificationRoutingKeyDLX = 'notificationRoutingKeyDLX';

        // Create exchange
        await channel.assertExchange(notificationExchange, 'direct', { durable: true });

        // Create queue
        const queueResult = await channel.assertQueue(notiQueueName, {
            exclusive: false, // Cho phép nhiều consumer cùng kết nối đến queue này
            deadLetterExchange: notificationExchangeDLX, // Đặt exchange DLX cho queue này
            deadLetterRoutingKey: notificationRoutingKeyDLX // Đặt routing key DLX cho queue này
        });

        // Bind queue to exchange
        await channel.bindQueue(queueResult.queue, notificationExchange, notiQueueName);

        // Send a message to the queue
        const msg = "A new product has been added to the system!";
        console.log(` [x] Sending message: ${msg}`);
        await channel.sendToQueue(notiQueueName, Buffer.from(msg), {
            expiration: "10000"
        })
        console.log(` [x] Sent message: ${msg}`);
        setTimeout(() => {
            connection.close();
            process.exit(0); // Exit the process after closing the connection
        }, 500); // Close the channel and connection after 500ms

    } catch (error) {
        console.error('Error in producer:', error);
    }
}

runProducer().catch(console.error);