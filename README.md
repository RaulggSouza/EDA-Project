# Guia de implementação — Projeto Kafka com NestJS

## 1. Objetivo

Este projeto demonstra comunicação assíncrona com Apache Kafka, utilizando NestJS, TypeScript e KafkaJS.

Cada integrante deve implementar seu próprio serviço consumidor, respeitando os contratos de mensageria compartilhados.

O projeto permite demonstrar:

- Producers e consumers.
- Tópicos e partições.
- Consumer groups.
- Distribuição de partições entre instâncias.
- Rebalanceamento quando um consumer entra ou sai do grupo.
- Offsets e lag.

## 2. Tecnologias e endereços

- **NestJS / TypeScript:** aplicação.
- **Apache Kafka 4.0.1:** broker Kafka.
- **KafkaJS:** cliente Kafka da aplicação.
- **Docker Compose:** execução local.

Endereços utilizados:

- Aplicação executada diretamente no computador: `localhost:9092`.
- Aplicações em containers na mesma rede Compose: `kafka:9092`.

Execute os comandos a partir da pasta que contém `docker-compose.yml` ou `compose.yaml`.

> Os comandos consideram os serviços `kafka`, `app` e `worker`, e o container Kafka chamado `kafka`. Se a configuração tiver sido alterada, confirme os nomes com `docker compose config --services` e `docker compose ps`.

## 3. Arquitetura de mensageria

A aplicação utiliza contratos genéricos para que os serviços de negócio não dependam diretamente do KafkaJS.

Os caminhos e nomes exatos podem variar conforme a organização atual do repositório.

| Componente | Responsabilidade |
|---|---|
| `MessageConsumer` | Contrato genérico para receber mensagens. |
| `MessagePublisher` | Contrato genérico para publicar mensagens. |
| `MessagingModule` | Expõe as implementações por tokens de injeção. |
| Consumer de negócio | Executa a lógica do seu domínio. |

**Regra principal:** serviços de negócio devem depender das interfaces e dos tokens de mensageria, não de classes concretas do KafkaJS.

## 4. Contrato de mensagens

O contrato de entrada utilizado no projeto é semelhante a:

```typescript
export interface IncomingMessage {
  destination: string;
  key?: string;
  payload: string;
}

export interface MessageConsumer {
  subscribe(
    destination: string,
    groupId: string,
    handler: (
      message: IncomingMessage,
    ) => Promise<void>,
  ): Promise<void>;
}

export const MESSAGE_CONSUMER =
  Symbol('MESSAGE_CONSUMER');
```

### Significado dos campos

- `destination`: tópico de origem.
- `key`: chave opcional do evento; pode influenciar a partição em que a mensagem será gravada.
- `payload`: conteúdo da mensagem, recebido como string.

Exemplo de payload JSON:

```json
{
  "status": "CREATED",
  "orderId": 702
}
```

O contrato recebe o payload como string. Cada consumer deve converter e validar o conteúdo de acordo com o formato esperado.

## 5. Como implementar um consumer

Cada integrante deve criar um serviço NestJS responsável pelo consumo de seu domínio.

### Passo 1 — Criar o serviço

Exemplo de `PaymentsConsumerService`:

```typescript
import {
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  MESSAGE_CONSUMER,
  MessageConsumer,
} from '../messaging/interfaces/message-consumer.interface';

@Injectable()
export class PaymentsConsumerService
  implements OnModuleInit
{
  constructor(
    @Inject(MESSAGE_CONSUMER)
    private readonly consumer: MessageConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.subscribe(
      'orders',
      'payments-consumer-group',
      async (message) => {
        console.log('[PAYMENTS] Evento recebido', {
          destination: message.destination,
          key: message.key,
          payload: message.payload,
        });

        // Implementar aqui a lógica do serviço.
      },
    );

    console.log('[PAYMENTS] Consumer iniciado');
  }
}
```

Ajuste o caminho do import conforme a localização real do arquivo no projeto.

O exemplo utiliza o tópico `orders` e o grupo `payments-consumer-group`. Se precisar consumir outro tópico, combine o nome com a equipe e garanta que ele exista.

### Passo 2 — Registrar o serviço no módulo de workers

Exemplo:

```typescript
import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { PaymentsConsumerService } from './payments-consumer.service';

@Module({
  imports: [MessagingModule],
  providers: [PaymentsConsumerService],
})
export class WorkerModule {}
```

Adapte os caminhos dos imports à estrutura real do repositório.

O `MessagingModule` disponibiliza o token `MESSAGE_CONSUMER`, associado ao adapter Kafka por meio de `useExisting`. O `KafkaModule` precisa exportar as classes concretas utilizadas pelo `MessagingModule`.

**Atenção:** não registre os mesmos consumers tanto no `app` quanto no `worker` sem intenção. Se a aplicação principal também inicializar consumers, ela participará dos grupos. Para testar o escalonamento, todos os processos que devem participar precisam usar o mesmo `groupId`, e os serviços devem ser registrados nos módulos definidos pela arquitetura do projeto.

### Passo 3 — Definir o consumer group

Use um identificador estável para cada grupo.

| Serviço | Consumer group |
|---|---|
| Pedidos | `orders-consumer-group` |
| Estoque | `stock-consumer-group` |
| Pagamentos | `payments-consumer-group` |

Não confunda o nome do tópico com o nome do grupo.

- **Mesmo tópico + grupos diferentes:** cada grupo consome os eventos de forma independente.
- **Mesmo tópico + mesmo grupo:** as instâncias dividem o trabalho entre si, conforme as partições disponíveis.

Se duas instâncias do mesmo serviço utilizam o mesmo `groupId`, elas participam do mesmo grupo. Cada partição pode ser atribuída a, no máximo, um membro desse grupo por vez.

### Passo 4 — Converter o payload

Exemplo de conversão de JSON:

```typescript
interface OrderEvent {
  orderId: number;
  status: string;
}

async (message) => {
  const event = JSON.parse(message.payload) as OrderEvent;

  console.log('Pedido recebido:', event.orderId);
  console.log('Status:', event.status);

  // Executar a lógica do serviço.
}
```

Esse exemplo pressupõe que o payload seja JSON válido e compatível com `OrderEvent`. Em código real, valide os dados antes de utilizá-los.

Não coloque lógica de negócio no adapter Kafka. O adapter cuida do transporte; o consumer cuida do domínio.

### Processamento e offsets

A implementação descrita utiliza o comportamento padrão de auto-commit do KafkaJS. Isso simplifica a demonstração, mas não garante processamento exatamente uma vez.

Em sistemas reais, considere falhas durante o processamento, duplicidade de eventos, idempotência e a relação entre o processamento de negócio e o avanço dos offsets.

Para este projeto didático, não altere a estratégia de commit sem combinar previamente com o responsável pela implementação.

## 6. Resumo rápido dos comandos

```powershell
# Subir tudo
docker compose up -d --build

# Listar containers
docker compose ps

# Ver logs dos workers
docker compose logs --tail 100 -f worker

# Escalar para duas instâncias
docker compose up -d --build --scale worker=2 worker

# Parar uma instância
docker stop kafka-nestjs-worker-2

# Iniciar uma instância
docker start kafka-nestjs-worker-2

# Listar tópicos
docker exec -it kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

# Descrever o tópico orders
docker exec -it kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic orders

# Listar consumer groups
docker exec -it kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list

# Consultar offsets e lag do grupo de pedidos
docker exec -it kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group orders-consumer-group

# Parar o ambiente
docker compose down
```

## 7. Caso de uso RabbitMQ — saga coreografada de pedidos

Fluxo independente do Kafka: Order → Inventory → Payment → Invoice → Email/Dispatch, com compensações. Cada serviço roda em um container próprio (`SERVICE`), usando `MESSAGING_DRIVER=rabbitmq`.

```bash
# Subir broker + 6 serviços
docker compose -f docker-compose.rabbitmq.yml up -d --build

# Management UI: http://localhost:15672 (guest / guest)

# Caminho feliz
curl -X POST localhost:3000/orders -H 'content-type: application/json' \
  -d '{"orderId":"1","items":[{"sku":"A","quantity":1}],"amount":10}'

# Consultar o status final do pedido
curl localhost:3000/orders/1

# Simular falhas: out_of_stock | payment_declined | invoice_failed
curl -X POST localhost:3000/orders -H 'content-type: application/json' \
  -d '{"orderId":"2","items":[{"sku":"A","quantity":1}],"amount":10,"simulate":"payment_declined"}'

# Logs de um serviço
docker compose -f docker-compose.rabbitmq.yml logs --tail 100 -f inventory

# Parar o ambiente
docker compose -f docker-compose.rabbitmq.yml down
```

### Frontend (`public/web-rabbitmq`)

Interface Vite + TypeScript + TailwindCSS + Axios que simula uma área de trabalho macOS. O serviço `web` do compose sobe o servidor de desenvolvimento do Vite junto com o resto:

```bash
docker compose -f docker-compose.rabbitmq.yml up -d --build

# Abrir http://localhost:5173
```

- Atalhos: `Alt+1` loja (`/finish-order`), `Alt+2` serviços (`/services`), `Alt+3` e-mail (`/email`).
- Na loja, o checkbox "Quebrar pedido" envia uma mensagem inválida, que vai para a `dead-letter` e aparece no e-mail como "Invalid message received".
- Em `/services`, o botão vermelho de cada janela derruba o serviço (para de consumir as filas) e o verde reativa. As mensagens ficam acumuladas no RabbitMQ e são processadas quando o serviço volta.
- Cada serviço expõe `GET /status`, `GET /events`, `POST /stop` e `POST /start` nas portas 3001 (inventory), 3002 (payment), 3003 (invoice), 3004 (email) e 3005 (dispatch).

Para rodar o frontend fora do Docker: `cd public/web-rabbitmq && npm install && npm run dev`.

Cada serviço guarda o estado em memória: não escale um serviço da saga (`--scale`), senão compensações podem cair em outra réplica sem o estado.

Mensagens cujo handler falha (ex.: payload inválido) são rejeitadas sem reentrega e seguem para a fila `dead-letter` via exchange `dlx`.
