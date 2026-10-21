# Roteiro da demo ao vivo, só Docker

A máquina da escola não tem Node, então tudo roda em containers. Todos os comandos partem da raiz do repositório. Cada passo diz o comando, o que mostrar na tela e o que deve aparecer. A ordem acompanha os slides "PoC, o que vamos montar" e "MQTT no código".

## 1. Subir tudo

```bash
docker compose -f docker-compose.mqtt.yml up --build
```

Mostrar: a tela com os três serviços subindo. O primeiro build demora mais.

Deve aparecer: o `mosquitto` ficando saudável, depois o `app` ouvindo na porta 3000 e o `entregador` conectando. Se preferir o terminal livre, use `up --build -d` e acompanhe com o passo 3.

## 2. Abrir o front

Abrir no navegador `http://localhost:3000/mqtt/`.

Mostrar: o canto superior com "Recebendo eventos", o selo de status em `online`, o painel de rastreamento com a posição mudando a cada 2 segundos e o rastro no mapa, e a auditoria ao lado recebendo a mesma posição. Esse é o comportamento 1 (publicar e receber em `entregas/1042/localizacao`) e o comportamento 2 (dois assinantes, a mesma posição).

## 3. Ver os logs

```bash
docker compose -f docker-compose.mqtt.yml logs -f app entregador
```

Deve aparecer, do entregador:

```
[entregador 42] conectado em mqtt://mosquitto:1883, status online
[entregador 42] entregas/1042/localizacao lat=-22.0084 lon=-47.8907
```

E a cada 2 segundos uma nova linha com a posição. Do app:

```
[rastreamento] entregas/1042/localizacao {"lat":...,"lon":...,"em":"..."}
[auditoria] entregas/1042/localizacao {"lat":...,"lon":...,"em":"..."}
```

Mostrar: a mesma posição aparecendo nas duas linhas, `[rastreamento]` e `[auditoria]`. Rode este comando em outro terminal se o `up` estiver em primeiro plano. Ctrl+C aqui só sai do log e não derruba os containers.

## 4. Espiar o broker por dentro

```bash
docker compose -f docker-compose.mqtt.yml exec mosquitto mosquitto_sub -t "entregas/#" -v
```

Mostrar: um terceiro assinante, agora de dentro do broker, usando o curinga `#`.

Deve aparecer: logo de cara a última posição retida e depois uma nova a cada 2 segundos, no formato `entregas/1042/localizacao {"lat":...}`.

Status do entregador:

```bash
docker compose -f docker-compose.mqtt.yml exec mosquitto mosquitto_sub -t "entregadores/+/status" -v
```

Deve aparecer na hora `entregadores/42/status online`, que é o valor retido. Deixe esse terminal aberto para o passo 6. Ctrl+C para sair.

## 5. Retained, assinante que chega depois

No front, clicar em "Conectar novo assinante" (comportamento 3).

Deve aparecer no quadro do botão:

```
tópico: entregas/1042/localizacao
payload: {"lat":...,"lon":...,"em":"..."}
retain: true
```

No log do app: `[novo assinante] recebeu entregas/1042/localizacao com retain=true`. A resposta crua é `{"topico":"entregas/1042/localizacao","payload":"{...}","retain":true}`.

Explicar: os assinantes antigos recebem ao vivo (`retain=false`), e quem chega agora recebe a guardada (`retain=true`) na hora, sem esperar os 2 segundos.

Opcional, para mostrar a retida no reinício do app:

```bash
docker compose -f docker-compose.mqtt.yml restart app
```

Nos logs do app, as duas conexões recebem posição e status logo ao assinar, com o sufixo ` (retain)`.

## 6. Last Will, derrubar o entregador

Deixe visíveis o front e, se quiser, o terminal do `mosquitto_sub -t "entregadores/+/status" -v`.

```bash
docker compose -f docker-compose.mqtt.yml kill entregador
```

Deve aparecer, em cerca de 1 segundo, o selo do front virando `offline` (vermelho), no `mosquitto_sub` a linha `entregadores/42/status offline` e no log do app `[rastreamento] entregador 42 está offline`. A posição para de andar. O container morreu sem se despedir, e quem publicou o `offline` foi o broker (comportamento 4).

Reiniciar o entregador. O `restart: on-failure` não religa container morto à mão, então precisa de um `start`:

```bash
docker compose -f docker-compose.mqtt.yml start entregador
```

Deve aparecer: `[entregador 42] conectado em mqtt://mosquitto:1883, status online`, o selo voltando a `online` e as posições voltando.

## 7. Desligar

```bash
docker compose -f docker-compose.mqtt.yml down
```

Remove os três containers e a rede. Se tiver rodado `up` em primeiro plano, pare antes com Ctrl+C.

## Se der errado

Porta 3000 ou 1883 ocupada. Em geral é outro compose do repositório ainda rodando. Derrube os outros e suba de novo:

```bash
docker compose -f docker-compose.rabbitmq.yml down
docker compose down
```

Container que não sobe. Veja o estado e o log do serviço:

```bash
docker compose -f docker-compose.mqtt.yml ps
docker compose -f docker-compose.mqtt.yml logs mosquitto
docker compose -f docker-compose.mqtt.yml logs app entregador
```

Se o `mosquitto` aparecer como `unhealthy`, o `app` e o `entregador` nem chegam a iniciar, e o log do broker mostra o motivo.

Front sem eventos. Confira o canto superior: deve estar "Recebendo eventos". Se estiver em "Reconectando", recarregue a página (F5) e veja o log do app com `logs -f app` para confirmar que as conexões `[rastreamento] conectado` e `[auditoria] conectado` aconteceram.

Posição parada com o selo `offline`. O entregador foi derrubado e não voltou. Rode o `start` do passo 6.
