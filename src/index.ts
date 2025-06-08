import Fastify from 'fastify';
import { fetchLatestBlock } from './services';

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

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Server running at http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 