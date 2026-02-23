import 'dotenv/config';
import connectMongoDB from './src/dbs/init.mongodb';
import RabbitMQConnection from './src/dbs/init.rabbitMQ';
import { startEmailConsumer, startNotificationConsumer } from './src/services/consumerQueue.service';

const main = async () => {
  try {
    // 1. Connect to MongoDB
    await connectMongoDB();

    // 2. Connect to RabbitMQ + setup topology
    const rmq = RabbitMQConnection.getInstance();
    await rmq.connect();
    await rmq.setupTopology();

    // 3. Start consumers (each with dedicated channel)
    await startEmailConsumer();
    await startNotificationConsumer();

    console.log('[Consumer Service] All consumers running');
  } catch (error: any) {
    console.error('[Consumer Service] Startup failed:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('[Consumer Service] Shutting down...');
  await RabbitMQConnection.getInstance().close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
