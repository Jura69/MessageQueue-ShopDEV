import * as amqp from 'amqplib';

export const connectToRabbitMQ = async (): Promise<{
  channel: amqp.Channel;
  connection: any;
}> => {
  try {
    const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
    const rabbitmqPort = process.env.RABBITMQ_PORT || '5672';
    const rabbitmqUser = process.env.RABBITMQ_USER || 'guest';
    const rabbitmqPass = process.env.RABBITMQ_PASS || 'guest';

    const connectionString = `amqp://${rabbitmqUser}:${rabbitmqPass}@${rabbitmqHost}:${rabbitmqPort}`;

    console.log(`Connecting to RabbitMQ at ${rabbitmqHost}:${rabbitmqPort}...`);

    const connection = await amqp.connect(connectionString);
    if (!connection) throw new Error('Connection not established');

    const channel = await connection.createChannel();

    console.log('✅ Connected to RabbitMQ successfully!');

    return { channel, connection };
  } catch (error: any) {
    console.error('❌ Failed to connect to RabbitMQ:', error.message);
    throw error;
  }
};

export const connectToRabbitMQForTest = async (): Promise<void> => {
  try {
    const { channel, connection: conn } = await connectToRabbitMQ();

    const queue = 'test-queue';
    const message = 'Hello, shopDEV by anonystick';
    await channel.assertQueue(queue);
    await channel.sendToQueue(queue, Buffer.from(message));

    await channel.close();
    if (conn && typeof conn.close === 'function') {
      await conn.close();
    }
  } catch (error: any) {
    console.error('Error connecting to RabitMQ', error);
  }
};

export const consumerQueue = async (
  channel: amqp.Channel,
  queueName: string
): Promise<void> => {
  try {
    await channel.assertQueue(queueName, { durable: true });

    console.log('Waiting for messages ...');

    channel.consume(
      queueName,
      (msg) => {
        if (msg) {
          console.log(`Received message: ${queueName} :: `, msg.content.toString());
        }
      },
      {
        noAck: true,
      }
    );
  } catch (error: any) {
    console.error('error publish message to rabbitMQ: : ', error);
    throw error;
  }
};

