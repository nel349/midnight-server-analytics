import { Client } from 'pg';
import dotenv from 'dotenv';
import { Block, Transaction } from './types';

dotenv.config();

interface BlockRow {
  hash: string;
  height: number;
  timestamp: string; // PG returns BIGINT as string
  protocol_version: number | null;
  author: string | null;
  parent_hash: string | null;
  parent_height: number | null;
  transactions: any; // JSONB column, will be parsed JSON object
}

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

const client = new Client(dbConfig);

export async function initDb() {
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        hash TEXT PRIMARY KEY,
        height INTEGER UNIQUE,
        timestamp BIGINT,
        protocol_version INTEGER,
        author TEXT,
        parent_hash TEXT,
        parent_height INTEGER,
        transactions JSONB
      );
    `);
    console.log('PostgreSQL database initialized and blocks table created.');
  } catch (error) {
    console.error('Error initializing PostgreSQL database:', error);
    process.exit(1);
  }
}

export async function insertBlock(block: Block) {
  const query = `
    INSERT INTO blocks (
      hash, height, timestamp, protocol_version, author, parent_hash, parent_height, transactions
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (hash) DO NOTHING;
  `;
  const values = [
    block.hash,
    block.height,
    block.timestamp,
    block.protocolVersion || null,
    block.author || null,
    block.parent?.hash || null,
    block.parent?.height || null,
    JSON.stringify(block.transactions || []),
  ];
  try {
    await client.query(query, values);
  } catch (error) {
    console.error('Error inserting block:', block.height, error);
  }
}

export async function getBlockByHeightFromDb(height: number): Promise<Block | null> {
  const query = 'SELECT * FROM blocks WHERE height = $1';
  const res = await client.query(query, [height]);
  if (res.rows.length > 0) {
    const row: BlockRow = res.rows[0];
    return {
      hash: row.hash,
      height: row.height,
      timestamp: Number(row.timestamp),
      protocolVersion: row.protocol_version || undefined,
      author: row.author || undefined,
      parent: row.parent_hash ? { hash: row.parent_hash, height: row.parent_height as number } : undefined,
      transactions: row.transactions || [],
    };
  }
  return null;
}

export async function getBlockByHashFromDb(hash: string): Promise<Block | null> {
  const query = 'SELECT * FROM blocks WHERE hash = $1';
  const res = await client.query(query, [hash]);
  if (res.rows.length > 0) {
    const row: BlockRow = res.rows[0];
    return {
      hash: row.hash,
      height: row.height,
      timestamp: Number(row.timestamp),
      protocolVersion: row.protocol_version || undefined,
      author: row.author || undefined,
      parent: row.parent_hash ? { hash: row.parent_hash, height: row.parent_height as number } : undefined,
      transactions: row.transactions || [],
    };
  }
  return null;
}

export async function getBlocksByTimeRangeFromDb(startTime: number, endTime: number): Promise<Block[]> {
  const query = 'SELECT * FROM blocks WHERE timestamp >= $1 AND timestamp <= $2 ORDER BY timestamp ASC';
  const res = await client.query(query, [startTime, endTime]);
  return res.rows.map((row: BlockRow) => ({
    hash: row.hash,
    height: row.height,
    timestamp: Number(row.timestamp),
    protocolVersion: row.protocol_version || undefined,
    author: row.author || undefined,
    parent: row.parent_hash ? { hash: row.parent_hash, height: row.parent_height as number } : undefined,
    transactions: row.transactions || [],
  }));
}

export async function getLatestBlockFromDb(): Promise<Block | null> {
  const query = 'SELECT * FROM blocks ORDER BY height DESC LIMIT 1';
  const res = await client.query(query);
  if (res.rows.length > 0) {
    const row: BlockRow = res.rows[0];
    return {
      hash: row.hash,
      height: row.height,
      timestamp: Number(row.timestamp),
      protocolVersion: row.protocol_version || undefined,
      author: row.author || undefined,
      parent: row.parent_hash ? { hash: row.parent_hash, height: row.parent_height as number } : undefined,
      transactions: row.transactions || [],
    };
  }
  return null;
} 