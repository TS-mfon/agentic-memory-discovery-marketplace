import { Pool } from "pg";
import { config } from "./config";

let pool: Pool | undefined;

function getPool() {
  if (!config.databaseUrl) return undefined;
  pool ??= new Pool({ connectionString: config.databaseUrl });
  return pool;
}

const memory = {
  events: [] as Array<Record<string, unknown>>,
  uploads: [] as Array<Record<string, unknown>>,
  sync: { lastBlock: config.deploymentBlock }
};

export async function initDb() {
  const db = getPool();
  if (!db) return;
  await db.query(`
    create table if not exists memory_events (
      id bigserial primary key,
      block_number bigint not null,
      tx_hash text not null,
      log_index integer not null,
      event_name text not null,
      payload jsonb not null,
      unique(tx_hash, log_index)
    );
    create table if not exists memory_uploads (
      id bigserial primary key,
      agent_address text not null,
      root_hash text not null,
      tx_hash text,
      encrypted boolean not null,
      size_bytes bigint not null,
      created_at timestamptz not null default now()
    );
    create table if not exists memory_sync_state (
      singleton boolean primary key default true,
      last_block bigint not null,
      check(singleton)
    );
    insert into memory_sync_state(singleton, last_block)
    values(true, $1)
    on conflict(singleton) do nothing;
  `, [config.deploymentBlock]);
}

export async function saveEvents(events: Array<Record<string, unknown>>) {
  const db = getPool();
  if (!db) {
    memory.events.push(...events);
    return;
  }
  await initDb();
  for (const event of events) {
    await db.query(
      "insert into memory_events(block_number, tx_hash, log_index, event_name, payload) values($1,$2,$3,$4,$5) on conflict do nothing",
      [event.blockNumber, event.txHash, event.logIndex, event.eventName, event]
    );
  }
}

export async function listEvents() {
  const db = getPool();
  if (!db) return memory.events;
  await initDb();
  const { rows } = await db.query("select payload from memory_events order by block_number desc, log_index desc limit 100");
  return rows.map((row) => row.payload);
}

export async function saveUpload(upload: Record<string, unknown>) {
  const db = getPool();
  if (!db) {
    memory.uploads.unshift(upload);
    return;
  }
  await initDb();
  await db.query(
    "insert into memory_uploads(agent_address, root_hash, tx_hash, encrypted, size_bytes) values($1,$2,$3,$4,$5)",
    [upload.agentAddress, upload.rootHash, upload.txHash ?? null, upload.encrypted, upload.sizeBytes]
  );
}

export async function listUploads() {
  const db = getPool();
  if (!db) return memory.uploads;
  await initDb();
  const { rows } = await db.query("select * from memory_uploads order by created_at desc limit 50");
  return rows;
}

export async function getLastBlock() {
  const db = getPool();
  if (!db) return memory.sync.lastBlock;
  await initDb();
  const { rows } = await db.query("select last_block from memory_sync_state where singleton = true");
  return Number(rows[0]?.last_block ?? config.deploymentBlock);
}

export async function setLastBlock(block: number) {
  const db = getPool();
  if (!db) {
    memory.sync.lastBlock = block;
    return;
  }
  await initDb();
  await db.query("update memory_sync_state set last_block = $1 where singleton = true", [block]);
}
