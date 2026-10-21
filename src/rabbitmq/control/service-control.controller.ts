import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ServiceActivity } from './service-activity';
import { ServiceControl } from './service-control.service';

@Controller()
export class ServiceControlController {
  constructor(
    private readonly control: ServiceControl,
    private readonly activity: ServiceActivity,
  ) {}

  @Get('status')
  getStatus() {
    return { service: process.env.SERVICE, status: this.control.status };
  }

  @Get('events')
  getEvents(@Query('after') after?: string) {
    return this.activity.list(Number(after) || 0);
  }

  @Post('stop')
  @HttpCode(200)
  async stop() {
    await this.control.stop();
    return this.getStatus();
  }

  @Post('start')
  @HttpCode(200)
  async start() {
    await this.control.start();
    return this.getStatus();
  }
}
