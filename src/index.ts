import Fastify from 'fastify';
import { fetchLatestBlock, fetchBlockByHeight, fetchLastNBlocks, fetchBlocksByTimeRange } from './services';
import { networkInterfaces } from 'os';

const fastify = Fastify({
  logger: true,
});

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Latest block endpoint
fastify.get('/api/latest-block', async (request, reply) => {
  try {
    const block = await fetchLatestBlock();
    return { block };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch latest block' });
  }
});

// Block by height (for block explorer, timeline, analytics)
fastify.get('/api/block/:height', async (request, reply) => {
  try {
    const height = parseInt((request.params as any).height, 10);
    if (isNaN(height)) {
      return reply.status(400).send({ error: 'Invalid block height' });
    }
    const block = await fetchBlockByHeight(height);
    return { block };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch block by height' });
  }
});

// Recent N blocks (for timeline visualizer, heatmap, analytics)
fastify.get('/api/blocks/recent', async (request, reply) => {
  try {
    const n = parseInt((request.query as any).n, 10) || 10;
    if (n < 1 || n > 100) {
      return reply.status(400).send({ error: 'n must be between 1 and 100' });
    }
    const blocks = await fetchLastNBlocks(n);
    return { blocks };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch recent blocks' });
  }
});

// Blocks in a time range (for heatmap, timeline, analytics)
fastify.get('/api/blocks/range', async (request, reply) => {
  try {
    const { startTime, endTime } = request.query as any;
    const start = parseInt(startTime, 10);
    const end = parseInt(endTime, 10);
    if (isNaN(start) || isNaN(end) || start > end) {
      return reply.status(400).send({ error: 'Invalid startTime or endTime' });
    }
    const blocks = await fetchBlocksByTimeRange(start, end);
    return { blocks };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch blocks by time range' });
  }
});

// Get local IP address
const getLocalIpAddress = () => {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Server running at http://localhost:3001');
    console.log(`🚀 Server running at http://${getLocalIpAddress()}:3001`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 