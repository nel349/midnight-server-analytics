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
  return response.data.data.block;
}

// Fetch a block by hash
export async function fetchBlockByHash(hash: string) {
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
  return response.data.data.block;
}

// Fetch the last N blocks (for timeline visualizer, heatmap, analytics)
export async function fetchLastNBlocks(n: number) {
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

// Fetch blocks in a time range (for heatmap, timeline, analytics)
// Since the schema does not support a blocks query, we walk backwards by height and filter by timestamp
export async function fetchBlocksByTimeRange(startTime: number, endTime: number, maxBlocks: number = 100) {
  const latest = await fetchLatestBlock();
  console.log(`[DEBUG] Latest block height: ${latest.height}, timestamp: ${latest.timestamp}`);
  console.log(`[DEBUG] Requested time range: startTime=${startTime}, endTime=${endTime}`);
  const blocks = [];
  let height = latest.height;
  let count = 0;
  while (height >= 0 && count < maxBlocks) {
    const block = await fetchBlockByHeight(height);
    if (!block) break;
    console.log(`[DEBUG] Fetched block height: ${block.height}, timestamp: ${block.timestamp}`);
    if (block.timestamp < startTime) break;
    if (block.timestamp <= endTime && block.timestamp >= startTime) {
      blocks.push(block);
    }
    height--;
    count++;
  }
  console.log(`[DEBUG] Returning ${blocks.length} blocks in range.`);
  return blocks;
} 