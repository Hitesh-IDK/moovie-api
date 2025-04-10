import { Client } from "pg";

const AuthMigrations = async (client: Client) => {
  await VerificationCodeMigrations(client);
};

export default AuthMigrations;

const VerificationCodeMigrations = async (client: Client) => {
  await client.query(`
        CREATE TABLE IF NOT EXISTS verification_codes (
            id SERIAL PRIMARY KEY,
            code VARCHAR(6) NOT NULL,
            phone VARCHAR(15) NOT NULL,
            status VARCHAR(15) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
};
