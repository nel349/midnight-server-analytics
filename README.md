# Midnight Server Analytics

This project provides a Fastify-based API server for fetching and serving Midnight blockchain data. It queries a GraphQL endpoint to retrieve information such as the latest block, blocks by height, recent blocks, and blocks within a specified time range.

## Features

*   **Latest Block:** Retrieve the most recently minted block on the Midnight blockchain.
*   **Block by Height:** Fetch a specific block using its height.
*   **Recent Blocks:** Get a list of the last N blocks.
*   **Blocks by Time Range:** Obtain blocks that fall within a given start and end timestamp.
*   **Health Check:** An endpoint to check the server's operational status.

## API Endpoints

*   `GET /health`
    *   Returns `{ "status": "ok" }` if the server is running.

*   `GET /api/latest-block`
    *   Returns the latest block data.

*   `GET /api/block/:height`
    *   `height`: The block height to fetch (e.g., `/api/block/123`).
    *   Returns block data for the specified height.

*   `GET /api/blocks/recent?n={number}`
    *   `n`: The number of recent blocks to fetch (e.g., `/api/blocks/recent?n=10`).
    *   Returns a list of the last `n` blocks. `n` must be between 1 and 100.

*   `GET /api/blocks/range?startTime={timestamp}&endTime={timestamp}`
    *   `startTime`: Unix timestamp in milliseconds for the start of the range.
    *   `endTime`: Unix timestamp in milliseconds for the end of the range.
    *   Returns a list of blocks within the specified time range.

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-repo/midnight-server-analytics.git
    cd midnight-server-analytics
    ```

2.  Install dependencies:

    ```bash
    npm install
    # or yarn install
    ```

### Running the Server

```bash
npm start
# or yarn start
```

The server will typically run on `http://localhost:3001`.

## Configuration

The GraphQL endpoint used for fetching data is currently hardcoded in `src/services.ts`:

```typescript
const GRAPHQL_ENDPOINT = 'https://indexer.testnet-02.midnight.network/api/v1/graphql';
```

For production or different environments, you might want to externalize this configuration (e.g., using environment variables).

## Development

To run in development mode with hot-reloading (if configured, typically through `ts-node-dev` or similar):

```bash
npm run dev
# or yarn dev
```

---

**Note:** This README assumes a standard Node.js project setup. Adjust paths and commands as necessary based on your actual project structure and scripts. 