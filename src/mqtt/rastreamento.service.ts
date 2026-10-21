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
  quem: 'rastreamento' | 'auditoria';
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
  private readonly registrosAuditoria: EventoMqtt[] = [];

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
      if (topico.startsWith('entregadores/')) {
        this.atualizarStatus(topico.split('/')[1], msg.toString());
        return;
      }
      const pedidoId = topico.split('/')[1];
      const posicao = this.lerPosicao(msg);
      if (posicao) {
        this.atualizarLocalizacao(pedidoId, posicao.lat, posicao.lon);
      }
    });

    this.auditoria = mqtt.connect(url, { clientId: 'auditoria' });
    this.auditoria.on('connect', () => {
      console.log('[auditoria] conectado');
      this.auditoria.subscribe('entregas/+/localizacao', { qos: 1 });
    });
    this.auditoria.on('message', (topico, msg, packet) => {
      const evento = this.registrar('auditoria', topico, msg, packet.retain);
      this.registrosAuditoria.push(evento);
      this.registrosAuditoria.splice(0, this.registrosAuditoria.length - 30);
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

  atualizarStatus(entregadorId: string, status: string) {
    this.status[entregadorId] = status;
    console.log(`[rastreamento] entregador ${entregadorId} está ${status}`);
  }

  estado() {
    return {
      status: this.status,
      posicoes: this.posicoes,
      auditoria: this.registrosAuditoria,
    };
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
        resolve({ topico, payload: msg.toString(), retain: packet.retain });
      });
    });
  }

  private registrar(
    quem: EventoMqtt['quem'],
    topico: string,
    msg: Buffer,
    retain: boolean,
  ): EventoMqtt {
    const evento = {
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
    return evento;
  }

  private lerPosicao(msg: Buffer): { lat: number; lon: number } | null {
    try {
      const { lat, lon } = JSON.parse(msg.toString()) as Posicao;
      return typeof lat === 'number' && typeof lon === 'number'
        ? { lat, lon }
        : null;
    } catch {
      return null;
    }
  }
}
