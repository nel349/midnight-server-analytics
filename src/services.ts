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