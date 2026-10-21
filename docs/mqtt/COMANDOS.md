# Roteiro da demo

Só precisa de Docker. Não é preciso instalar Node. O primeiro `up --build` baixa as imagens e instala as dependências, então leva alguns minutos. Depois disso sobe em segundos. Todos os comandos partem da raiz do repositório.

## 1. Subir

```bash
docker compose -f docker-compose.mqtt.yml up --build
```

Sobem `mosquitto`, `app` (porta 3000) e `entregador`. Para deixar o terminal livre, use `up --build -d`.

## 2. Abrir o front

Abrir `http://localhost:3000/mqtt/`. Para acompanhar os logs em outro terminal:

```bash
docker compose -f docker-compose.mqtt.yml logs -f app entregador
```

## 3. Os quatro comportamentos

1. Publicar e receber. A posição muda a cada 2 segundos no painel de rastreamento e o rastro aparece no mapa. No log, `[entregador 42] entregas/1042/localizacao lat=... lon=...`.
2. Dois assinantes. A auditoria recebe a mesma posição. No log aparecem as linhas `[rastreamento]` e `[auditoria]` com o mesmo payload. Para ver o broker por dentro, com o curinga `#`:

```bash
docker compose -f docker-compose.mqtt.yml exec mosquitto mosquitto_sub -t "entregas/#" -v
```

3. Retained. Clicar em "Conectar novo assinante". O quadro mostra o payload com `retain: true`, e o log do app, `[novo assinante] recebeu entregas/1042/localizacao com retain=true`. Quem já estava conectado recebe `retain=false`, e quem chega agora recebe a guardada na hora.
4. Last Will. Derrubar o entregador sem ele se despedir:

```bash
docker compose -f docker-compose.mqtt.yml kill entregador
```

Em cerca de 1 segundo o selo fica `offline` e o log do app mostra `[rastreamento] entregadores/42/status offline`. O `offline` foi publicado pelo broker. Para ver o status retido no terminal:

```bash
docker compose -f docker-compose.mqtt.yml exec mosquitto mosquitto_sub -t "entregadores/+/status" -v
```

Religar (o `restart: on-failure` não religa container morto à mão). O selo volta a `online` e as posições voltam:

```bash
docker compose -f docker-compose.mqtt.yml start entregador
```

## 4. Desligar

```bash
docker compose -f docker-compose.mqtt.yml down
```

Se o `up` estiver em primeiro plano, pare antes com Ctrl+C.

## Se der errado

Porta 3000 ou 1883 ocupada costuma ser outro compose do repositório ainda rodando.

```bash
docker compose -f docker-compose.rabbitmq.yml down
docker compose down
```

Container que não sobe. Veja o estado e os logs. Com o `mosquitto` `unhealthy`, app e entregador nem iniciam.

```bash
docker compose -f docker-compose.mqtt.yml ps
docker compose -f docker-compose.mqtt.yml logs mosquitto
```

Front sem eventos. Se o canto superior mostrar "Reconectando", recarregue a página e confira no log do app se `[rastreamento] conectado` e `[auditoria] conectado` apareceram.

Selo `offline` com a posição parada. O entregador foi derrubado e não voltou, então rode o `start` do Last Will.
