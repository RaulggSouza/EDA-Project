import { Injectable } from "@nestjs/common";
import { Kafka, logLevel } from "kafkajs";

@Injectable()
export class KafkaService {
    readonly client: Kafka;

    constructor() {
        this.client = new Kafka({
            clientId: "kafka-nestjs",
            brokers: ["localhost:9092"],
            logLevel: logLevel.ERROR,
        });
    }
}