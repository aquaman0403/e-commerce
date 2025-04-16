const amqp = require('amqplib');
const { set } = require('lodash');

const messages = "Xin chào, tôi là một tin nhắn RabbitMQ!";

const runProducer = async () => {
    try {
        const connection = await amqp.connect('amqp://guest:12345@localhost');
        const channel = await connection.createChannel();
        const queueName = 'test-topic';
        await channel.assertQueue(queueName, { durable: true });

        // Send a message to consumer channel
        channel.sendToQueue(queueName, Buffer.from(messages))
        console.log(` [x] Sent ${messages}`);
        setTimeout(() => {
            connection.close();
            process.exit(0); // Exit the process after closing the connection
        }, 500); // Close the channel and connection after 500ms

    } catch (error) {
        console.error('Error in producer:', error);
    }
}

runProducer().catch(console.error);