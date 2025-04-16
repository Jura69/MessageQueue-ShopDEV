'use strict';

const {
  consumerQueue,
  connectToRabbitMQ
} = require('../dbs/init.rabbitMQ');

const messageService = {
  consumerToQueue: async (queueName) => {
    try {
      const { channel, connection } = await connectToRabbitMQ();
      await consumerQueue(channel, queueName);
    } catch (error) {
      // Handle error
      console.error('Error consuming message from RabbitMQ:', error);
    }
  }
};

module.exports = messageService;
