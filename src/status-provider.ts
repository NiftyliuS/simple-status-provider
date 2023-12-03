import express from 'express';
import {
  ProviderHealthStatuses,
  ProviderOptionsInterface,
  ProviderStatuses,
  ProviderStatusMemoryUsageInterface,
  ProviderStatusResponse,
} from './status-provider.interface';

export * from './status-provider.interface';

export const startStatusProvider = (options: ProviderOptionsInterface): express.Express => {
  const statusServer = express();
  const dbEnabled = options.dbEnabled ?? true;
  const natsEnabled = options.natsEnabled ?? true;
  const rabbitMqEnabled = options.rabbitMqEnabled ?? true;
  const redisEnabled = options.redisEnabled ?? false;
  statusServer.get('/readiness', (_req, res): void => {
    (async (): Promise<any> => {
      try {
        const response = await options.readiness();
        if (response.ready) {
          res.send(response);
        } else {
          res.status(500).send({ ready: false });
        }
      } catch (e) {
        res.status(500).send({ ready: false });
      }
    })();
  });

  statusServer.get('/liveliness', (_req, res): void => {
    (async (): Promise<void> => {
      try {
        const response = await options.liveliness();
        if (response.alive) {
          res.send(response);
        } else {
          res.status(500).send({ alive: false });
        }
      } catch (e) {
        res.status(500).send({ alive: false });
      }
    })();
  });

  statusServer.get('/status', (_req, res): void => {
    (async (): Promise<void> => {
      const { rss, heapUsed, heapTotal, external, arrayBuffers } = process.memoryUsage();
      const memoryStats: ProviderStatusMemoryUsageInterface = {
        rss: Number((rss / 1024 / 1024).toFixed(2)),
        heapUsed: Number((heapUsed / 1024 / 1024).toFixed(2)),
        heapTotal: Number((heapTotal / 1024 / 1024).toFixed(2)),
        external: Number((external / 1024 / 1024).toFixed(2)),
        arrayBuffers: Number((arrayBuffers / 1024 / 1024).toFixed(2)),
      };

      try {
        const response = await options.status();
        if (!dbEnabled) {
          response.database = ProviderStatuses.DISABLED;
          response.databaseResponseTime = -1;
        }
        if (!natsEnabled) {
          response.nats = ProviderStatuses.DISABLED;
          response.natsResponseTime = -1;
        }
        if (!redisEnabled) {
          response.redis = ProviderStatuses.DISABLED;
          response.redisResponseTime = -1;
        }
        if (!rabbitMqEnabled) {
          response.rabbitMq = ProviderStatuses.DISABLED;
          response.rabbitMqQueueSize = -1;
          response.rabbitMqResponseTime = -1;
        }
        res.send({
          ramUsage: memoryStats,
          ...response,
        } as ProviderStatusResponse);
      } catch (e) {
        res.status(500).send({
          ramUsage: memoryStats,
          error: true,
          ready: false,
          alive: false,
          database: dbEnabled ? ProviderStatuses.ERROR : ProviderStatuses.DISABLED,
          nats: natsEnabled ? ProviderStatuses.ERROR : ProviderStatuses.DISABLED,
          redis: redisEnabled ? ProviderStatuses.ERROR : ProviderStatuses.DISABLED,
          databaseResponseTime: dbEnabled ? 99999 : -1,
          natsResponseTime: natsEnabled ? 99999 : -1,
          redisResponseTime: redisEnabled ? 99999 : -1,
          rabbitMqQueueSize: -1,
          rabbitMqResponseTime: rabbitMqEnabled ? 99999 : -1,
        } as ProviderStatusResponse);
      }
    })();
  });

  statusServer.get('/health', (_req, res): void => {
    (async (): Promise<void> => {
      try {
        const response = await options.health();
        res.send(response);
      } catch (e) {
        res.status(500).send({
          error: true,
          status: ProviderHealthStatuses.ERROR,
        });
      }
    })();
  });

  statusServer.listen(options.port, options.host || '0.0.0.0');

  if (options.silent !== true) {
    console.info(`Status provider running at ${options.host || '0.0.0.0'}:${options.port}`);
  }

  return statusServer;
};
