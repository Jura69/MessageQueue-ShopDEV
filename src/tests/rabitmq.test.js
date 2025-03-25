'use strict';

const { connectToRabbitMQForTest } = require('../dbs/init.rabitMQ');

describe('RabbitMQ Connection', () => {
  it('should connect to successful RabbitMQ', async () => {
    const result = await connectToRabbitMQForTest();
    expect(result).toBeUndefined();
  });
});

