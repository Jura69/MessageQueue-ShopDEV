import * as amqp from 'amqplib';
import Notification from '../models/notification.model';
import { RABBITMQ_CONFIG } from '../dbs/init.rabbitMQ';

const { MAX_RETRIES, DLX_EXCHANGE } = RABBITMQ_CONFIG;

const NOTI_CONTENT_MAP: Record<string, string> = {
    'ORDER-001': '@@@ has placed an order successfully: @@@@',
    'ORDER-002': 'Order @@@ status updated: @@@@',
    'PROMOTION-001': '@@@ just added a new voucher',
    'SHOP-001': '@@@ just added a new product: @@@@',
};

export const handleNotificationMessage = async (
    msg: amqp.ConsumeMessage,
    channel: amqp.Channel
): Promise<void> => {
    const content = JSON.parse(msg.content.toString());
    const { payload, metadata } = content;
    const { correlationId } = metadata;
    const { type, receivedId, senderId, options } = payload;

    try {
        console.log(`[Notification] Processing ${type} (${correlationId})`);

        await Notification.create({
            noti_type: type,
            noti_content: NOTI_CONTENT_MAP[type] || '',
            noti_senderId: senderId,
            noti_receivedId: receivedId,
            noti_options: options,
        });

        channel.ack(msg);
        console.log(`[Notification] Created ${type} for user ${receivedId} (${correlationId})`);
    } catch (error: any) {
        console.error(`[Notification] Failed ${type} (${correlationId}):`, error.message);

        const deaths = msg.properties.headers?.['x-death'] || [];
        const retryCount = deaths.length > 0 ? deaths[0].count || 0 : 0;

        if (retryCount >= MAX_RETRIES) {
            channel.publish(DLX_EXCHANGE, 'dead', msg.content, {
                persistent: true,
                headers: msg.properties.headers,
            });
            channel.ack(msg);
        } else {
            channel.nack(msg, false, false);
        }
    }
};
