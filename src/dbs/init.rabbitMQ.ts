import * as amqp from 'amqplib';

export const EXCHANGE = 'shopdev.notifications';
export const DLX_EXCHANGE = 'shopdev.notifications.dlx';
const RETRY_TTL = 10_000;
const MAX_RETRIES = 3;
const HEARTBEAT = 60;

export const RABBITMQ_CONFIG = { EXCHANGE, DLX_EXCHANGE, RETRY_TTL, MAX_RETRIES };

class RabbitMQConnection {
  private static instance: RabbitMQConnection;
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;

  static getInstance(): RabbitMQConnection {
    if (!RabbitMQConnection.instance) {
      RabbitMQConnection.instance = new RabbitMQConnection();
    }
    return RabbitMQConnection.instance;
  }

  async connect(): Promise<amqp.Channel> {
    if (this.channel) return this.channel;

    const host = process.env.RABBITMQ_HOST || 'localhost';
    const port = process.env.RABBITMQ_PORT || '5672';
    const user = process.env.RABBITMQ_USER || 'guest';
    const pass = process.env.RABBITMQ_PASS || 'guest';
    const url = `amqp://${user}:${pass}@${host}:${port}?heartbeat=${HEARTBEAT}`;

    const conn = await amqp.connect(url);
    this.connection = conn;
    this.channel = await conn.createChannel();

    conn.on('error', (err: Error) => {
      console.error('[RabbitMQ] Connection error:', err.message);
      this.scheduleReconnect();
    });
    conn.on('close', () => {
      console.warn('[RabbitMQ] Connection closed');
      this.channel = null;
      this.connection = null;
      this.scheduleReconnect();
    });

    this.reconnectDelay = 1000;
    console.log('[RabbitMQ] Connected successfully');
    return this.channel;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    console.log(`[RabbitMQ] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
        this.scheduleReconnect();
      }
    }, this.reconnectDelay);
  }

  async getChannel(): Promise<amqp.Channel> {
    if (!this.channel) await this.connect();
    return this.channel!;
  }

  async createChannel(): Promise<amqp.Channel> {
    if (!this.connection) await this.connect();
    return this.connection!.createChannel();
  }

  async setupTopology(): Promise<void> {
    const ch = await this.getChannel();

    // Main exchange (topic for flexible routing)
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });

    // DLX exchange (direct for retry/dead routing)
    await ch.assertExchange(DLX_EXCHANGE, 'direct', { durable: true });

    // Main queues with DLX routing
    await ch.assertQueue('email-queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': DLX_EXCHANGE,
        'x-dead-letter-routing-key': 'retry',
      },
    });
    await ch.assertQueue('notification-queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': DLX_EXCHANGE,
        'x-dead-letter-routing-key': 'retry',
      },
    });

    // Retry queue — messages wait here then re-route to main exchange
    await ch.assertQueue('retry-queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGE,
        'x-message-ttl': RETRY_TTL,
      },
    });

    // Dead letter queue — final destination after max retries
    await ch.assertQueue('dead-letter-queue', { durable: true });

    // Bind main queues to exchange
    await ch.bindQueue('email-queue', EXCHANGE, 'notification.email.*');
    await ch.bindQueue('notification-queue', EXCHANGE, 'notification.push.*');

    // Bind DLX queues
    await ch.bindQueue('retry-queue', DLX_EXCHANGE, 'retry');
    await ch.bindQueue('dead-letter-queue', DLX_EXCHANGE, 'dead');

    console.log('[RabbitMQ] Topology setup complete');
  }

  async close(): Promise<void> {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.channel) await this.channel.close().catch(() => { });
    if (this.connection) await this.connection.close().catch(() => { });
    this.channel = null;
    this.connection = null;
  }
}

export default RabbitMQConnection;
