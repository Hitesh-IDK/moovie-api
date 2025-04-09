import pg, { Pool, PoolConfig, types } from "pg";

export const config: PoolConfig = {
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DBNAME,
  host: process.env.DBHOST,
  port: Number(process.env.DBPORT),
};

// Parse Bigint to number
pg.types.setTypeParser(20, (value: string) => Number(value));
// Parse Numeric to number
pg.types.setTypeParser(types.builtins.NUMERIC, (value: string) =>
  Number(value)
);

export const pool = new Pool(config);
