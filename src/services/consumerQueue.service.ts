import RabbitMQConnection from '../dbs/init.rabbitMQ';
import { handleEmailMessage } from '../handlers/email-consumer-handler';
import { handleNotificationMessage } from '../handlers/notification-consumer-handler';

const EMAIL_PREFETCH = 5;
const NOTIFICATION_PREFETCH = 10;

export const startEmailConsumer = async (): Promise<void> => {
  const channel = await RabbitMQConnection.getInstance().createChannel();
  await channel.prefetch(EMAIL_PREFETCH);

  await channel.consume('email-queue', (msg) => {
    if (msg) handleEmailMessage(msg, channel);
  });

  console.log(`[Consumer] Email consumer started (prefetch=${EMAIL_PREFETCH}, dedicated channel)`);
};

export const startNotificationConsumer = async (): Promise<void> => {
  const channel = await RabbitMQConnection.getInstance().createChannel();
  await channel.prefetch(NOTIFICATION_PREFETCH);

  await channel.consume('notification-queue', (msg) => {
    if (msg) handleNotificationMessage(msg, channel);
  });

  console.log(`[Consumer] Notification consumer started (prefetch=${NOTIFICATION_PREFETCH}, dedicated channel)`);
};
