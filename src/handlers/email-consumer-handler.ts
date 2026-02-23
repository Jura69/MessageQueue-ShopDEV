import * as amqp from 'amqplib';
import emailService from '../services/email.service';
import { RABBITMQ_CONFIG } from '../dbs/init.rabbitMQ';

const { MAX_RETRIES, DLX_EXCHANGE } = RABBITMQ_CONFIG;

export const handleEmailMessage = async (
    msg: amqp.ConsumeMessage,
    channel: amqp.Channel
): Promise<void> => {
    const content = JSON.parse(msg.content.toString());
    const { type, payload, metadata } = content;
    const { correlationId } = metadata;

    try {
        console.log(`[Email] Processing ${type} (${correlationId})`);

        switch (type) {
            case 'order-confirmed':
                await emailService.sendOrderConfirmation(payload.to, payload.orderId, payload.total);
                break;
            case 'order-cancelled':
                await emailService.sendCancellation(payload.to, payload.orderId, payload.reason);
                break;
            case 'order-updated':
                await emailService.sendShippingUpdate(payload.to, payload.orderId, payload.status);
                break;
            case 'welcome':
                await emailService.sendWelcome(payload.to, payload.name);
                break;
            case 'password-reset':
                await emailService.sendPasswordReset(payload.to, payload.resetToken);
                break;
            default:
                console.warn(`[Email] Unknown type: ${type}`);
        }

        channel.ack(msg);
        console.log(`[Email] Sent ${type} to ${payload.to} (${correlationId})`);
    } catch (error: any) {
        console.error(`[Email] Failed ${type} (${correlationId}):`, error.message);
        handleRetry(msg, channel);
    }
};

function handleRetry(msg: amqp.ConsumeMessage, channel: amqp.Channel): void {
    const deaths = msg.properties.headers?.['x-death'] || [];
    const retryCount = deaths.length > 0 ? deaths[0].count || 0 : 0;

    if (retryCount >= MAX_RETRIES) {
        console.error(`[Email] Max retries (${MAX_RETRIES}) reached, sending to dead-letter`);
        channel.publish(DLX_EXCHANGE, 'dead', msg.content, {
            persistent: true,
            headers: msg.properties.headers,
        });
        channel.ack(msg);
    } else {
        // nack without requeue — DLX routes to retry-queue
        channel.nack(msg, false, false);
    }
}
