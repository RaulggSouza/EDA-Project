import { Injectable } from '@nestjs/common';
import { Kafka, logCreator, logLevel } from 'kafkajs';

const customLogCreator: logCreator = () => {
  return ({ log }) => {
    if (
      log.message ===
      'The group is rebalancing, so a rejoin is needed'
    ) {
      return;
    }

    console.error(log);
  };
};


@Injectable()
export class KafkaService {
  readonly client: Kafka;

  constructor() {
    this.client = new Kafka({
      clientId: 'kafka-nestjs',
      brokers: [process.env.KAFKA_BROKERS ?? 'localhost:9092'],
      logLevel: logLevel.ERROR,
    });
  }
}
