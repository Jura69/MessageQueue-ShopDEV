import {
  consumerQueue,
  connectToRabbitMQ,
} from '../dbs/init.rabbitMQ';
import * as amqp from 'amqplib';

const messageService = {
  consumerToQueue: async (queueName: string): Promise<void> => {
    try {
      const { channel } = await connectToRabbitMQ();
      await consumerQueue(channel, queueName);
    } catch (error: any) {
      console.error('Error consuming message from RabbitMQ:', error);
    }
  },

  consumerToQueueNormal: async (_queueName: string): Promise<void> => {
    try {
      const { channel } = await connectToRabbitMQ();

      const notiQueue = 'notificationQueueProcess';

      await channel.assertQueue(notiQueue, { durable: true });
      console.log(`✅ Queue '${notiQueue}' asserted successfully`);

      channel.consume(notiQueue, (msg: amqp.ConsumeMessage | null) => {
        try {
          if (!msg) return;

          const numberTest = Math.random();
          console.log({ numberTest });

          if (numberTest < 0.8) {
            throw new Error('Send notification failed: : HOT FIX');
          }

          console.log(
            `SEND notificationQueue sucessfully processed: `,
            msg.content.toString()
          );
          channel.ack(msg);
        } catch (error: any) {
          if (msg) {
            channel.nack(msg, false, false);
          }
        }
      });

      channel.consume(notiQueue, (msg: amqp.ConsumeMessage | null) => {
        if (msg) {
          console.log(
            `SEND notificationQueue success :: `,
            msg.content.toString()
          );
          channel.ack(msg);
        }
      });
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  },

  consumerToQueueFailed: async (_queueName: string): Promise<void> => {
    try {
      const { channel } = await connectToRabbitMQ();

      const notificationExchangeDLX = 'notificationExDLX';
      const notificationRoutingKeyDLX = 'notificationRoutingKeyDLX';
      const notiQueueHandler = 'notificationQueueHotFix';

      await channel.assertExchange(notificationExchangeDLX, 'direct', {
        durable: true,
      });

      const queueResult = await channel.assertQueue(notiQueueHandler, {
        exclusive: false,
      });

      await channel.bindQueue(
        queueResult.queue,
        notificationExchangeDLX,
        notificationRoutingKeyDLX
      );

      await channel.consume(
        queueResult.queue,
        (msgFailed: amqp.ConsumeMessage | null) => {
          if (msgFailed) {
            console.log(
              `this notificaton error:, pls hot fix: : `,
              msgFailed.content.toString()
            );
          }
        },
        {
          noAck: true,
        }
      );
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  },
};

export default messageService;

