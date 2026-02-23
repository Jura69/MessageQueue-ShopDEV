import 'dotenv/config';
import RabbitMQConnection, { RABBITMQ_CONFIG } from '../dbs/init.rabbitMQ';
import { randomUUID } from 'node:crypto';

const testMessages = [
    {
        routingKey: 'notification.email.order-confirmed',
        message: {
            type: 'order-confirmed',
            payload: { to: 'test@example.com', orderId: '507f1f77bcf86cd799439011', total: 99.99 },
            metadata: { correlationId: randomUUID(), timestamp: Date.now(), retryCount: 0, source: 'test' },
        },
    },
    {
        routingKey: 'notification.email.welcome',
        message: {
            type: 'welcome',
            payload: { to: 'newuser@example.com', name: 'Test User' },
            metadata: { correlationId: randomUUID(), timestamp: Date.now(), retryCount: 0, source: 'test' },
        },
    },
    {
        routingKey: 'notification.push.order',
        message: {
            type: 'order',
            payload: { type: 'ORDER-001', receivedId: 1, senderId: '507f1f77bcf86cd799439011', options: { orderId: 'test-123' } },
            metadata: { correlationId: randomUUID(), timestamp: Date.now(), retryCount: 0, source: 'test' },
        },
    },
];

async function main() {
    const rmq = RabbitMQConnection.getInstance();
    await rmq.connect();
    await rmq.setupTopology();
    const channel = await rmq.getChannel();

    for (const { routingKey, message } of testMessages) {
        channel.publish(
            RABBITMQ_CONFIG.EXCHANGE,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true, contentType: 'application/json' }
        );
        console.log(`✅ Published: ${routingKey} → ${message.type}`);
    }

    console.log(`\n📨 Published ${testMessages.length} test messages`);
    console.log('Run consumer to process: npx ts-node server.ts');

    setTimeout(async () => {
        await rmq.close();
        process.exit(0);
    }, 1000);
}

main().catch(console.error);
