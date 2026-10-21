import axios, { type AxiosInstance } from 'axios';
import { SERVICE_NAMES, SERVICE_URLS, type ServiceName } from '../config';

const REQUEST_TIMEOUT_MS = 3000;

export interface ActivityEvent {
  id: number;
  at: string;
  type: string;
  message: string;
  orderId?: string;
  subject?: string;
}

export type ServiceStatus = 'up' | 'down';

interface StatusResponse {
  status: ServiceStatus;
}

const clients = Object.fromEntries(
  SERVICE_NAMES.map((name) => [
    name,
    axios.create({ baseURL: SERVICE_URLS[name], timeout: REQUEST_TIMEOUT_MS }),
  ]),
) as Record<ServiceName, AxiosInstance>;

export async function fetchStatus(service: ServiceName): Promise<ServiceStatus> {
  const { data } = await clients[service].get<StatusResponse>('/status');
  return data.status;
}

export async function fetchEvents(
  service: ServiceName,
  after: number,
): Promise<ActivityEvent[]> {
  const { data } = await clients[service].get<ActivityEvent[]>('/events', {
    params: { after },
  });
  return data;
}

export async function stopService(service: ServiceName): Promise<ServiceStatus> {
  const { data } = await clients[service].post<StatusResponse>('/stop');
  return data.status;
}

export async function startService(
  service: ServiceName,
): Promise<ServiceStatus> {
  const { data } = await clients[service].post<StatusResponse>('/start');
  return data.status;
}
