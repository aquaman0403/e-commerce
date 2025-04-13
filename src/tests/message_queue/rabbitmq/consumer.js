const amqp = require('amqplib');

const runConsumer = async () => {
    try {
        const connection = await amqp.connect('amqp://guest:12345@localhost');
        const channel = await connection.createChannel();
        const queueName = 'test-topic';
        await channel.assertQueue(queueName, { durable: true });

        // Send a message to consumer channel
        channel.consume(queueName, (messages) => {
            console.log(` [x] Received ${messages.content.toString()}`);
        }, {
            noAck: true // Acknowledge the message after processing
        })

    } catch (error) {
        console.error('Error in producer:', error);
    }
}

runConsumer().catch(console.error);