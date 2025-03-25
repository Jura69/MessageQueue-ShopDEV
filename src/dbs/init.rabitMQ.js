'use strict';

const amqp = require('amqplib'); 

const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect('amqp://user:password@localhost');
    if (!connection) throw new Error('Connection not established');

    const channel = await connection.createChannel();
    return { channel, connection };
  } catch (error) {
    // Handle error
  }
};

const connectToRabbitMQForTest = async () => {
  try {
    const { channel, connection } = await connectToRabbitMQ();

    // Publish message to a queue
    const queue = 'test-queue';
    const message = 'Hello, shopDEV by anonystick';
    await channel.assertQueue(queue);
    await channel.sendToQueue(queue, Buffer.from(message));

    //close connection
    await connection.close();
  } catch (error) {
    // Handle error
    console.error('Error connecting to RabitMQ', error);
  }
};

module.exports = {
  connectToRabbitMQ,
  connectToRabbitMQForTest,
};
