import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Consumer, KafkaMessage } from 'kafkajs';
import { Observable, Subject } from 'rxjs';
import type { IncomingMessage, MessageConsumer } from '../messaging/interfaces/message-consumer.interface';
import { KafkaConsumerGroup } from './types/kafka-consumer-group.enum';
import { KafkaService } from './kafka.service';

export interface DemoEvent {
  type: string;
  timestamp: string;
  [key: string]: unknown;
}

interface ManagedConsumer {
  id: string;
  name: string;
  groupId: string;
  destination: string;
  consumer: Consumer;
  memberId?: string;
  assignments: number[];
  status: 'starting' | 'running' | 'rebalancing' | 'stopping' | 'error';
}

const DEMO_TOPIC = 'orders';

@Injectable()
export class KafkaConsumerAdapter implements MessageConsumer, OnModuleDestroy {
  private readonly consumers = new Map<string, ManagedConsumer>();
  private readonly eventSubject = new Subject<DemoEvent>();

  constructor(private readonly kafkaService: KafkaService) {}

  events(): Observable<DemoEvent> {
    return this.eventSubject.asObservable();
  }

  async subscribe(
    destination: string,
    groupId: string,
    handler: (message: IncomingMessage) => Promise<void>,
  ): Promise<void> {
    await this.startConsumer({
      id: randomUUID(), name: `Consumer ${this.consumers.size + 1}`,
      groupId, destination, handler,
    });
  }

  async createDemoConsumer(groupId: KafkaConsumerGroup, name?: string) {
    const id = randomUUID();
    const consumerName = name?.trim().slice(0, 40) || `Consumer ${this.consumers.size + 1}`;
    await this.startConsumer({
      id, name: consumerName, groupId, destination: DEMO_TOPIC,
      handler: async () => undefined,
    });
    this.emit({
      type: 'consumer_created', consumerId: id, consumerName, groupId,
      message: `${consumerName} entrou no grupo ${groupId}.`,
    });
    return { id, name: consumerName, groupId };
  }

  async removeDemoConsumer(id: string): Promise<void> {
    const managed = this.consumers.get(id);
    if (!managed) throw new Error(`Consumer "${id}" não foi encontrado.`);
    managed.status = 'stopping';
    managed.assignments = [];
    this.emit({
      type: 'consumer_stopping', consumerId: id, consumerName: managed.name,
      groupId: managed.groupId, message: `${managed.name} está saindo do grupo ${managed.groupId}.`,
    });
    try {
      await managed.consumer.stop();
    } finally {
      await managed.consumer.disconnect().catch(() => undefined);
      this.consumers.delete(id);
      this.emit({
        type: 'consumer_removed', consumerId: id, consumerName: managed.name,
        groupId: managed.groupId, message: `${managed.name} saiu do grupo ${managed.groupId}.`,
      });
      this.emitState();
    }
  }

  recordPublished(orderId: string, message: string): void {
    this.emit({
      type: 'published', eventId: randomUUID(), orderId, message,
      destination: DEMO_TOPIC,
      description: `Pedido ${orderId} enviado para o tópico ${DEMO_TOPIC}.`,
    });
  }

  async getDemoState() {
    const admin = this.kafkaService.client.admin();
    await admin.connect();
    try {
      const metadata = await admin.fetchTopicMetadata({ topics: [DEMO_TOPIC] });
      const partitions = metadata.topics.find((topic) => topic.name === DEMO_TOPIC)
        ?.partitions.map(({ partitionId }) => partitionId) ?? [];
      const groups = Object.values(KafkaConsumerGroup).map((groupId) => {
        const members = [...this.consumers.values()].filter((entry) => entry.groupId === groupId);
        return {
          groupId, topic: DEMO_TOPIC,
          rebalancing: members.some((entry) => entry.status === 'rebalancing'),
          consumers: members.map(({ id, name, memberId, status, assignments }) => ({
            id, name, memberId: memberId ?? null, status, assignments,
          })),
          partitions: partitions.map((partition) => {
            const owner = members.find((entry) => entry.assignments.includes(partition));
            return { partition, consumerId: owner?.id ?? null, consumerName: owner?.name ?? null };
          }),
        };
      });
      return { topic: DEMO_TOPIC, groups };
    } finally {
      await admin.disconnect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.consumers.values()].map(async ({ consumer }) => {
      await consumer.stop().catch(() => undefined);
      await consumer.disconnect().catch(() => undefined);
    }));
    this.eventSubject.complete();
  }

  private async startConsumer(options: {
    id: string; name: string; groupId: string; destination: string;
    handler: (message: IncomingMessage) => Promise<void>;
  }): Promise<void> {
    const { id, name, groupId, destination, handler } = options;
    const consumer = this.kafkaService.client.consumer({ groupId });
    const managed: ManagedConsumer = {
      id, name, groupId, destination, consumer, assignments: [], status: 'starting',
    };
    this.consumers.set(id, managed);

    consumer.on(consumer.events.REBALANCING, () => {
      for (const member of this.consumers.values()) {
        if (member.groupId === groupId && member.status !== 'stopping') {
          member.status = 'rebalancing';
          member.assignments = [];
        }
      }
      this.emit({ type: 'rebalancing', groupId, message: `Rebalanceando o grupo ${groupId}.` });
      this.emitState();
    });
    consumer.on(consumer.events.GROUP_JOIN, ({ payload }) => {
      managed.memberId = payload.memberId;
      managed.assignments = payload.memberAssignment[destination] ?? [];
      managed.status = 'running';
      const groupMembers = [...this.consumers.values()].filter(
        (member) => member.groupId === groupId && member.status !== 'stopping',
      );
      if (groupMembers.every((member) => member.status === 'running')) {
        this.emit({ type: 'group_stable', groupId, message: `O grupo ${groupId} concluiu o rebalanceamento.` });
      }
      this.emitState();
    });
    consumer.on(consumer.events.CRASH, ({ payload }) => {
      managed.status = 'error';
      this.emit({
        type: 'consumer_error', consumerId: id, consumerName: name, groupId,
        message: `Falha no ${name}: ${payload.error.message}`,
      });
      this.emitState();
    });

    try {
      await consumer.connect();
      await consumer.subscribe({ topic: destination, fromBeginning: true });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          this.emitConsumed(managed, topic, partition, message);
          await handler({
            destination: topic, partition, offset: message.offset,
            key: message.key?.toString(), payload: message.value?.toString() ?? '',
          });
        },
      });
    } catch (error) {
      this.consumers.delete(id);
      await consumer.disconnect().catch(() => undefined);
      throw error;
    }
  }

  private emitConsumed(managed: ManagedConsumer, topic: string, partition: number, message: KafkaMessage): void {
    this.emit({
      type: 'consumed', eventId: randomUUID(), consumerId: managed.id,
      consumerName: managed.name, groupId: managed.groupId, destination: topic,
      partition, offset: message.offset, key: message.key?.toString() ?? null,
      payload: message.value?.toString() ?? '',
      description: `${managed.name} (${managed.groupId}) consumiu uma mensagem da partição ${partition}.`,
    });
  }

  private emitState(): void {
    void this.getDemoState()
      .then((state) => this.emit({ type: 'state', state }))
      .catch((error: unknown) => this.emit({
        type: 'state_error',
        message: error instanceof Error ? error.message : 'Falha ao consultar o estado do Kafka.',
      }));
  }

  private emit(event: { type: string; [key: string]: unknown }): void {
    this.eventSubject.next({ ...event, timestamp: new Date().toISOString() });
  }
}
