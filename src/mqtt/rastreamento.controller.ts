import { Controller, Get, MessageEvent, Post, Sse } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { RastreamentoService } from './rastreamento.service';

@Controller('mqtt')
export class RastreamentoController {
  constructor(private readonly rastreamento: RastreamentoService) {}

  @Get('estado')
  estado() {
    return this.rastreamento.estado();
  }

  @Sse('eventos')
  eventos(): Observable<MessageEvent> {
    return this.rastreamento
      .acompanharEventos()
      .pipe(map((data) => ({ data })));
  }

  @Post('novo-assinante')
  novoAssinante() {
    return this.rastreamento.novoAssinante();
  }
}
