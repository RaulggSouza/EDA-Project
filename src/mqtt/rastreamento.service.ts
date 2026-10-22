import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as mqtt from 'mqtt';
import { Observable, Subject } from 'rxjs';

const url = process.env.MQTT_URL ?? 'mqtt://localhost:1883';

type Posicao = { lat: number; lon: number; em: string };

export type EventoMqtt = {
  quem: 'rastreamento' | 'auditoria' | 'novo-assinante';
  topico: string;
  payload: string;
  retain: boolean;
  em: string;
};

@Injectable()
export class RastreamentoService implements OnModuleInit, OnModuleDestroy {
  private rastreamento: mqtt.MqttClient;
  private auditoria: mqtt.MqttClient;
  private readonly eventos = new Subject<EventoMqtt>();
  private readonly status: Record<string, string> = {};
  private readonly posicoes: Record<string, Posicao[]> = {};

  onModuleInit() {
    this.rastreamento = mqtt.connect(url, { clientId: 'rastreamento' });
    this.rastreamento.on('connect', () => {
      console.log('[rastreamento] conectado');
      this.rastreamento.subscribe(
        ['entregas/+/localizacao', 'entregadores/+/status'],
        { qos: 1 },
      );
    });
    this.rastreamento.on('message', (topico, msg, packet) => {
      this.registrar('rastreamento', topico, msg, packet.retain);
      const id = topico.split('/')[1];
      if (topico.startsWith('entregadores/')) {
        this.status[id] = msg.toString();
        return;
      }
      const { lat, lon } = JSON.parse(msg.toString()) as Posicao;
      this.atualizarLocalizacao(id, lat, lon);
    });

    this.auditoria = mqtt.connect(url, { clientId: 'auditoria' });
    this.auditoria.on('connect', () => {
      console.log('[auditoria] conectado');
      this.auditoria.subscribe('entregas/+/localizacao', { qos: 1 });
    });
    this.auditoria.on('message', (topico, msg, packet) => {
      this.registrar('auditoria', topico, msg, packet.retain);
    });
  }

  onModuleDestroy() {
    this.rastreamento.end();
    this.auditoria.end();
  }

  atualizarLocalizacao(pedidoId: string, lat: number, lon: number) {
    const rastro = (this.posicoes[pedidoId] ??= []);
    rastro.push({ lat, lon, em: new Date().toISOString() });
    rastro.splice(0, rastro.length - 20);
  }

  estado() {
    return { status: this.status, posicoes: this.posicoes };
  }

  acompanharEventos(): Observable<EventoMqtt> {
    return this.eventos.asObservable();
  }

  novoAssinante(): Promise<{
    topico: string;
    payload: string;
    retain: boolean;
  }> {
    return new Promise((resolve, reject) => {
      const cliente = mqtt.connect(url, {
        clientId: `novo-assinante-${Date.now()}`,
      });
      const desistir = setTimeout(() => {
        cliente.end();
        reject(new NotFoundException('O broker não tem posição guardada.'));
      }, 3000);

      cliente.on('connect', () => {
        cliente.subscribe('entregas/1042/localizacao', { qos: 1 });
      });
      cliente.once('message', (topico, msg, packet) => {
        clearTimeout(desistir);
        cliente.end();
        console.log(
          `[novo assinante] recebeu ${topico} com retain=${packet.retain}`,
        );
        this.eventos.next({
          quem: 'novo-assinante',
          topico,
          payload: msg.toString(),
          retain: packet.retain,
          em: new Date().toISOString(),
        });
        resolve({ topico, payload: msg.toString(), retain: packet.retain });
      });
    });
  }

  private registrar(
    quem: EventoMqtt['quem'],
    topico: string,
    msg: Buffer,
    retain: boolean,
  ) {
    const evento: EventoMqtt = {
      quem,
      topico,
      payload: msg.toString(),
      retain,
      em: new Date().toISOString(),
    };
    console.log(
      `[${quem}] ${topico} ${evento.payload}${retain ? ' (retain)' : ''}`,
    );
    this.eventos.next(evento);
  }
}
