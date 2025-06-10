import { fetchLatestBlock, fetchBlockByHeight } from './services';
import { initDb, insertBlock, getLatestBlockFromDb } from './database';
import { Block } from './types';

const POLLING_INTERVAL_MS = 1 * 60 * 1000; // Poll for new blocks every minute
const BACKFILL_BATCH_SIZE = 1000; // How many blocks to backfill at once

async function indexBlock(height: number) {
  try {
    const block = await fetchBlockByHeight(height);
    if (block) {
      await insertBlock(block);
      console.log(`Indexed block ${block.height}: ${block.hash}`);
    }
  } catch (error) {
    console.error(`Error indexing block ${height}:`, error);
  }
}

async function backfillHistoricalBlocks() {
  console.log('Starting historical backfill...');
  const latestIndexedBlock = await getLatestBlockFromDb();
  const latestNetworkBlock = await fetchLatestBlock();

  let startHeight = latestIndexedBlock ? latestIndexedBlock.height - BACKFILL_BATCH_SIZE: 0; // Start from 30 blocks back from the latest indexed block
  let endHeight = latestNetworkBlock.height;

  console.log(`Backfill range: ${startHeight} to ${endHeight}`);

  while (startHeight <= endHeight) {
    const batchEndHeight = Math.min(startHeight + BACKFILL_BATCH_SIZE - 1, endHeight);
    const blockPromises: Promise<void>[] = [];

    for (let i = startHeight; i <= batchEndHeight; i++) {
      blockPromises.push(indexBlock(i));
    }

    await Promise.all(blockPromises);
    console.log(`Backfilled blocks from ${startHeight} to ${batchEndHeight}`);
    startHeight = batchEndHeight + 1;
  }
  console.log('Historical backfill complete.');
}

async function startIndexer() {
  await initDb();
  await backfillHistoricalBlocks();

  console.log('Starting continuous indexing...');
  let lastKnownHeight = (await getLatestBlockFromDb())?.height || 0;

  setInterval(async () => {
    try {
      const latestBlock = await fetchLatestBlock();
      if (latestBlock && latestBlock.height > lastKnownHeight) {
        console.log(`New latest block detected: ${latestBlock.height} (previously ${lastKnownHeight})`);
        for (let h = lastKnownHeight + 1; h <= latestBlock.height; h++) {
          await indexBlock(h);
        }
        lastKnownHeight = latestBlock.height;
      } else if (latestBlock) {
        console.log(`No new blocks. Current latest: ${latestBlock.height}`);
      }
    } catch (error) {
      console.error('Error during continuous indexing:', error);
    }
  }, POLLING_INTERVAL_MS);
}

startIndexer(); 