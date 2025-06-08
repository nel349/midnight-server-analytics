import axios from 'axios';

const GRAPHQL_ENDPOINT = 'https://indexer.testnet-02.midnight.network/api/v1/graphql';

export async function fetchLatestBlock() {
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

  return response.data.data.block;
}

// Fetch a block by height (for block explorer, timeline, and analytics)
export async function fetchBlockByHeight(height: number) {
  const query = `
    query GetBlockByHeight($height: Int!) {
      block(offset: { height: $height }) {
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
    query,
    variables: { height }
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (response.data.errors) {
    throw new Error(JSON.stringify(response.data.errors));
  }
  return response.data.data.block;
}

// Fetch the last N blocks (for timeline visualizer, heatmap, and analytics)
export async function fetchLastNBlocks(n: number) {
  // First get the latest block to know the current height
  const latest = await fetchLatestBlock();
  const latestHeight = latest.height;
  const blockPromises = [];
  for (let i = 0; i < n; i++) {
    const height = latestHeight - i;
    if (height >= 0) {
      blockPromises.push(fetchBlockByHeight(height));
    }
  }
  return Promise.all(blockPromises);
}

// Fetch blocks in a time range (for heatmap, timeline, and analytics)
export async function fetchBlocksByTimeRange(startTime: number, endTime: number) {
  const query = `
    query GetBlocksByTimeRange($startTime: Int!, $endTime: Int!) {
      blocks(where: { timestamp: { gte: $startTime, lte: $endTime } }) {
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
    query,
    variables: { startTime, endTime }
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (response.data.errors) {
    throw new Error(JSON.stringify(response.data.errors));
  }
  return response.data.data.blocks;
} 