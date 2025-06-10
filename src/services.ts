import axios from 'axios';
import { getBlockByHeightFromDb, getBlockByHashFromDb, getBlocksByTimeRangeFromDb } from './database';
import { Block } from './types';

const GRAPHQL_ENDPOINT = 'https://indexer.testnet-02.midnight.network/api/v1/graphql';

export async function fetchLatestBlock(): Promise<Block> {
  const query = `
    query GetLatestBlock {
      block {
        hash
        height
        timestamp
        transactions {
          hash
          identifiers
        }
      }
    }
  `;

  const response = await axios.post(GRAPHQL_ENDPOINT, {
    query
  }, {
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.data.errors) {
    throw new Error(JSON.stringify(response.data.errors));
  }
  const block: Block = response.data.data.block;
  return block;
}

// Fetch a block by height (for block explorer, timeline, and analytics)
export async function fetchBlockByHeight(height: number): Promise<Block | null> {
  // Try to get from DB first
  const blockFromDb = await getBlockByHeightFromDb(height);
  if (blockFromDb) {
    console.log(`[DEBUG] Found block ${height} in DB.`);
    return blockFromDb;
  }

  const query = `
    query GetBlockByHeight($height: Int!) {
      block(offset: { height: $height }) {
        hash
        height
        protocolVersion
        timestamp
        author
        parent {
          hash
          height
        }
        transactions {
          hash
          identifiers
          applyStage
          raw
          merkleTreeRoot
          contractActions {
            __typename
            ... on ContractDeploy {
              address
              state
              chainState
            }
            ... on ContractCall {
              address
              state
              chainState
              entryPoint
              deploy { address }
            }
            ... on ContractUpdate {
              address
              state
              chainState
            }
          }
        }
      }
    }
  `;
  const response = await axios.post(GRAPHQL_ENDPOINT, {
    query,
    variables: { height }
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (response.data.errors) {
    throw new Error(JSON.stringify(response.data.errors));
  }
  const block: Block = response.data.data.block;
  return block;
}

// Fetch a block by hash
export async function fetchBlockByHash(hash: string): Promise<Block | null> {
  // Try to get from DB first
  const blockFromDb = await getBlockByHashFromDb(hash);
  if (blockFromDb) {
    return blockFromDb;
  }

  const query = `
    query GetBlockByHash($hash: String!) {
      block(offset: { hash: $hash }) {
        hash
        height
        protocolVersion
        timestamp
        author
        parent {
          hash
          height
        }
        transactions {
          hash
          identifiers
          applyStage
          raw
          merkleTreeRoot
          contractActions {
            __typename
            ... on ContractDeploy {
              address
              state
              chainState
            }
            ... on ContractCall {
              address
              state
              chainState
              entryPoint
              deploy { address }
            }
            ... on ContractUpdate {
              address
              state
              chainState
            }
          }
        }
      }
    }
  `;
  const response = await axios.post(GRAPHQL_ENDPOINT, {
    query,
    variables: { hash }
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (response.data.errors) {
    throw new Error(JSON.stringify(response.data.errors));
  }
  const block: Block = response.data.data.block;
  return block;
}

// Fetch the last N blocks (for timeline visualizer, heatmap, analytics)
export async function fetchLastNBlocks(n: number): Promise<Block[]> {
  const latest = await fetchLatestBlock(); // This will prioritize DB
  const blocks: Block[] = [];
  // We need to fetch from the latest backwards, checking DB and then falling back to network.
  for (let i = 0; i < n; i++) {
    const height = latest.height - i;
    if (height >= 0) {
      const block = await fetchBlockByHeight(height); // This will prioritize DB
      if (block) {
        blocks.push(block);
      } else {
        // If a block is not found (e.g., gap in indexing, or too old), we might need to fetch from network
        // However, fetchBlockByHeight already handles fallback to network, so no extra logic here.
        // If it's null, it means it's not found on network either or an error occurred.
      }
    }
  }
  return blocks.filter(Boolean).sort((a, b) => a.height - b.height); // Filter out nulls and sort by height
}

// Fetch blocks in a time range (for heatmap, timeline, analytics)
export async function fetchBlocksByTimeRange(startTime: number, endTime: number, maxBlocks: number = 100): Promise<Block[]> {
  // Try to get from DB first
  const blocksFromDb = await getBlocksByTimeRangeFromDb(startTime, endTime);
  if (blocksFromDb.length > 0) {
    console.log(`[DEBUG] Found ${blocksFromDb.length} blocks in DB for time range.`);
    return blocksFromDb;
  }

  // If not in DB, fall back to walking backwards from latest and inserting
  const latest = await fetchLatestBlock();
  console.log(`[DEBUG] Latest block height: ${latest.height}, timestamp: ${latest.timestamp}`);
  console.log(`[DEBUG] Requested time range: startTime=${startTime}, endTime=${endTime}`);
  const blocks: Block[] = [];
  let height = latest.height;
  let count = 0;
  while (height >= 0 && count < maxBlocks) {
    const block = await fetchBlockByHeight(height); // This will prioritize DB, then fall back to network
    if (!block) break;
    console.log(`[DEBUG] Fetched block height: ${block.height}, timestamp: ${block.timestamp}`);
    if (block.timestamp < startTime) break; // Blocks are in descending order of height, so timestamp decreases
    if (block.timestamp >= startTime && block.timestamp <= endTime) {
      blocks.push(block);
    }
    height--;
    count++;
  }
  console.log(`[DEBUG] Returning ${blocks.length} blocks in range.`);
  return blocks.sort((a, b) => a.height - b.height); // Ensure blocks are sorted by height
} 