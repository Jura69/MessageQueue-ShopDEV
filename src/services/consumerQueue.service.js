'use strict';

const {
  consumerQueue,
  connectToRabbitMQ
} = require('../dbs/init.rabbitMQ');

// const log = console.log
// console.log = function () { 
//   log.apply(console, [new Date()].concat(arguments))
// }

const messageService = {
  consumerToQueue: async (queueName) => {
    try {
      const { channel, connection } = await connectToRabbitMQ();
      await consumerQueue(channel, queueName);
    } catch (error) {
      // Handle error
      console.error('Error consuming message from RabbitMQ:', error);
    }
  },
  // case processing
  consumerToQueueNormal: async (queueName) => {
    try {
      const { channel, connection } = await connectToRabbitMQ();

      const notiQueue = 'notificationQueueProcess'; // assertQueue

      // 2. LOGIC
      channel.consume(notiQueue, msg => {
        try {
          const numberTest = Math.random();
          console.log({ numberTest });

          if (numberTest < 0.8) {
            throw new Error('Send notification failed: : HOT FIX');
          }

          console.log(`SEND notificationQueue sucessfully processed: `, msg.content.toString());
          channel.ack(msg);
        } catch (error) {
          //console.error('SEND notification error:', error);
          channel.nack(msg, false, false);
          /*
          nack: negative acknowledgement
          */
        }
      });

      channel.consume(notiQueue, msg => {
        console.log(`SEND notificationQueue success :: `, msg.content.toString());
        channel.ack(msg);
      })

  
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  // case failed processing
  consumerToQueueFailed: async (queueName) => {
    try {
      const { channel, connection } = await connectToRabbitMQ();

      const notificationExchangeDLX = 'notificationExDLX'; // notificationEx direct
      const notificationRoutingKeyDLX = 'notificationRoutingKeyDLX'; // assert
      const notiQueueHandler = 'notificationQueueHotFix';

      // 1. Create Exchange
      await channel.assertExchange(notificationExchangeDLX, 'direct', { durable: true });

      // 2. Create Queue
      const queueResult = await channel.assertQueue(notiQueueHandler, { exclusive: false });

      // 3. Bind Queue
      await channel.bindQueue(
        queueResult.queue,
        notificationExchangeDLX,
        notificationRoutingKeyDLX
      );

      // 4. Consume messages
      await channel.consume(queueResult.queue, (msgFailed) => {
        console.log(`this notificaton error:, pls hot fix: : `, msgFailed.content.toString());
      }, {
        noAck: true
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
};

module.exports = messageService;
