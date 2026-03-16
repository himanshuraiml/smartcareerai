import * as amqp from 'amqplib';

let connection: any = null;
let channel: any = null;
let connectionFailed = false;

/**
 * Get or create a singleton RabbitMQ connection.
 */
export async function getRabbitMQChannel(): Promise<amqp.Channel | null> {
    if (!process.env.RABBITMQ_URL) return null;
    if (connectionFailed) return null;

    if (!connection) {
        try {
            connection = await amqp.connect(process.env.RABBITMQ_URL) as any;
            channel = await connection!.createChannel();

            connection.on('error', (err: Error) => {
                console.error('[RabbitMQ] Connection error:', err.message);
                connectionFailed = true;
            });

            connection.on('close', () => {
                console.warn('[RabbitMQ] Connection closed.');
                connectionFailed = true;
                connection = null;
                channel = null;
            });

        } catch (error) {
            console.error('[RabbitMQ] Failed to connect:', error);
            connectionFailed = true;
            return null;
        }
    }

    return channel;
}

/**
 * Publish a message to a RabbitMQ queue
 */
export async function publishMessage(queue: string, message: any): Promise<boolean> {
    const ch = await getRabbitMQChannel();
    if (!ch) return false;

    try {
        await ch.assertQueue(queue, { durable: true });
        return ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true
        });
    } catch (error) {
        console.error(`[RabbitMQ] Failed to publish message to queue ${queue}:`, error);
        return false;
    }
}

/**
 * Consume messages from a RabbitMQ queue
 */
export async function consumeMessages(queue: string, handler: (message: any) => Promise<void>): Promise<void> {
    const ch = await getRabbitMQChannel();
    if (!ch) return;

    try {
        await ch.assertQueue(queue, { durable: true });

        // Process one message at a time
        ch.prefetch(1);

        ch.consume(queue, async (msg: amqp.ConsumeMessage | null) => {
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    await handler(content);
                    ch.ack(msg); // Only ack if perfectly handled
                } catch (err) {
                    console.error(`[RabbitMQ] Error handling message from queue ${queue}:`, err);
                    ch.nack(msg, false, true); // Requeue message on failure
                }
            }
        });

        console.log(`[RabbitMQ] Listening to queue: ${queue}`);
    } catch (error) {
        console.error(`[RabbitMQ] Failed to consume from queue ${queue}:`, error);
    }
}

/**
 * Disconnect RabbitMQ gracefully
 */
export async function disconnectRabbitMQ(): Promise<void> {
    if (channel) {
        await channel.close();
        channel = null;
    }
    if (connection) {
        await connection.close();
        connection = null;
    }
}
