import {
  consumerToQueueNormal,
  consumerToQueueFailed,
} from './src/services/consumerQueue.service';

const queueName = 'test-topic';

consumerToQueueNormal(queueName)
  .then(() => {
    console.log(`Message consumerToQueueNormal started`);
  })
  .catch((err: Error) => {
    console.error(`Message Error: ${err.message}`);
  });

consumerToQueueFailed(queueName)
  .then(() => {
    console.log(`Message consumerToQueueFailed started`);
  })
  .catch((err: Error) => {
    console.error(`Message Error: ${err.message}`);
  });

