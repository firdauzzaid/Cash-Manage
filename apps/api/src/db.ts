import pg from "pg";
pg.types.setTypeParser(1082, (value) => value);
export const { Pool } = pg;
export type { PoolClient, Pool as Database } from "pg";
