import * as mqtt from 'mqtt';

const url = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
const topicoPosicao = 'entregas/1042/localizacao';
const topicoStatus = 'entregadores/42/status';

const client = mqtt.connect(url, {
  clientId: 'entregador-42',
  will: {
    topic: topicoStatus,
    payload: 'offline',
    qos: 1,
    retain: true,
  },
});

let passo = 0;

function proximaPosicao() {
  passo = (passo + 1) % 100;
  const angulo = (passo / 100) * 2 * Math.PI;
  return {
    lat: Number((-22.0087 + Math.sin(angulo) * 0.006).toFixed(6)),
    lon: Number((-47.8909 + Math.cos(angulo) * 0.008).toFixed(6)),
    em: new Date().toISOString(),
  };
}

function publicarPosicao() {
  if (!client.connected) return;

  const posicao = proximaPosicao();
  client.publish(topicoPosicao, JSON.stringify(posicao), {
    qos: 1,
    retain: true,
  });
  console.log(
    `[entregador 42] ${topicoPosicao} lat=${posicao.lat} lon=${posicao.lon}`,
  );
}

client.on('connect', () => {
  client.publish(topicoStatus, 'online', { qos: 1, retain: true });
  console.log(`[entregador 42] conectado em ${url}, status online`);
});

client.on('error', (erro) => {
  console.log(`[entregador 42] erro: ${erro.message}`);
});

setInterval(publicarPosicao, 2000);
