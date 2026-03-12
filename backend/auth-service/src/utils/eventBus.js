import amqp from 'amqplib';

let connection = null;
let channel = null;

const EXCHANGE = 'clinical_hub_events';

/**
 * Connect to RabbitMQ
 */
export const connectEventBus = async () => {
    try {
        const url = process.env.RABBITMQ_URL || 'amqp://localhost';
        connection = await amqp.connect(url);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
        console.log('✅ Connected to RabbitMQ Event Bus');
    } catch (error) {
        console.error('❌ RabbitMQ Connection Error:', error.message);
        // We don't exit process, allowing the service to run without events if needed (graceful degradation)
    }
};

/**
 * Publish an event to the exchange
 */
export const publishEvent = async (routingKey, data) => {
    if (!channel) {
        console.warn('⚠️ Event Bus not ready. Event lost:', routingKey);
        return;
    }
    const message = JSON.stringify(data);
    channel.publish(EXCHANGE, routingKey, Buffer.from(message));
    console.log(`📤 [Event Published] ${routingKey}`);
};

/**
 * Subscribe to an event with a specific queue
 */
export const subscribeToEvent = async (queueName, routingKey, callback) => {
    if (!channel) {
        // If not ready, wait and retry
        setTimeout(() => subscribeToEvent(queueName, routingKey, callback), 1000);
        return;
    }

    const q = await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(q.queue, EXCHANGE, routingKey);

    channel.consume(q.queue, (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log(`📥 [Event Received] ${routingKey}`);
                callback(data);
                channel.ack(msg);
            } catch (err) {
                console.error('Error processing event:', err.message);
                channel.nack(msg, false, false); // Don't requeue if malformed
            }
        }
    });
};
