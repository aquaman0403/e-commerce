const amqp = require('amqplib');

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

    } catch (error) {
        console.error('Error in producer:', error);
    }
}

runProducer().catch(console.error);