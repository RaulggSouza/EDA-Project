export type MessagingDriver =
  | 'kafka'
  | 'rabbitmq'
  | 'mqtt'
  | 'webhook';

export function getMessagingDriver(): MessagingDriver {
  const driver = process.env.MESSAGING_DRIVER ?? 'kafka';

  const supportedDrivers: MessagingDriver[] = [
    'kafka',
    'rabbitmq',
    'mqtt',
    'webhook',
  ];

  if (!supportedDrivers.includes(driver as MessagingDriver)) {
    throw new Error(`Unsupported messaging driver: ${driver}`);
  }

  return driver as MessagingDriver;
}