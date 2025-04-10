import dotenv from "dotenv";
dotenv.config({ path: `${process.cwd()}/.env` });

import { Client, PoolConfig } from "pg";
import { config } from "./config";
import PromptSync from "prompt-sync";
import { GreenText, RedText, YellowText } from "../util/colored-console";
import AuthMigrations from "./schema/auth";

const migrations = async (client: Client) => {
  await client.connect();

  await AuthMigrations(client);
};

/**
 * Runs database migrations for all modules. If `reset` is true, the existing database is dropped and recreated.
 *
 * Prompts the user for admin credentials to create the database. If credentials are invalid or empty, the migration process is aborted.
 *
 * Establishes a connection to the PostgreSQL database, creates or drops the specified database, and executes migration scripts for various modules.
 *
 * Logs the time taken to complete the migration process.
 *
 * @param reset - Indicates whether to reset the database before running migrations.
 */
export const runMigrations = async (reset: boolean = false) => {
  const startTime: number = Date.now();

  if (reset) {
    const isVerified = await verifyResetConfirmation();
    if (!isVerified) {
      return;
    }
  }

  console.error(`Migrating ${config.database}....`);

  const prompt = PromptSync({ sigint: true });
  const MigrationConfig: PoolConfig = { ...config };

  const adminUser = prompt(`${YellowText("Admin User")}: `)
    .toLowerCase()
    .replace(/ /g, "_");
  const adminPassword = prompt(`${YellowText("Admin Password")}: `);

  if (adminUser.length === 0 || adminPassword.length === 0) {
    console.log("\nUser and Password cannot be empty\n");
    console.log("Aborting Migrations...\n");
    return;
  }

  MigrationConfig.user = adminUser;
  MigrationConfig.password = adminPassword;

  // TRY TO CREATE DATABASE USING THE INBUILT POSTGRES DATABASE
  const client = new Client(MigrationConfig);
  const tempClient = new Client({ ...MigrationConfig, database: "postgres" });

  try {
    try {
      await tempClient.connect();

      if (reset) {
        await tempClient.query("DROP DATABASE IF EXISTS " + MigrationConfig.database);
        console.log("Database dropped! Starting migrations...\n");
      }

      await tempClient.query(`CREATE DATABASE ${MigrationConfig.database}`);

      console.log("Database initialized!\n");
    } catch (e) {
      console.log(RedText((e as unknown as Error).message));
      console.log("Aborting Migrations...\n");
      await client.end();

      return;
    } finally {
      await tempClient.end();
    }

    // IF CREATE DATABASE WAS SUCCESSFUL, START USING OUR DATABASE AND GENERATE TABLES
    await migrations(client);

    console.log("\nTIME TAKEN TO MIGRATE:", Date.now() - startTime, "ms");
  } catch (e) {
    console.log(RedText((e as unknown as Error).message));
    console.log("Aborting Migrations...\n");
    return;
  } finally {
    await client.end();
  }
};

const verifyResetConfirmation = async (): Promise<boolean> => {
  const environment = process.env.ENVIRONMENT;

  if (environment === "production") {
    console.log(RedText("Resetting production database is not allowed!"));
    return false;
  }
  try {
    const prompt = PromptSync({ sigint: true });

    const choice = prompt(
      `${YellowText("WARNING: Are you sure you want to reset the database?")} (${GreenText("y") + "es"}/${
        RedText("n") + "o"
      }): `
    ).toLowerCase();
    if (choice !== "y" && choice !== "yes") {
      console.log("\nAborting Reset...\n");
      return false;
    }
  } catch (e) {
    console.log(RedText((e as unknown as Error).message));
    console.log("Aborting Reset...\n");
    return false;
  }

  return true;
};

// Check for reset flags
let shouldReset: boolean = false;
process.argv.slice(2).forEach((arg) => {
  if (arg === "--reset") {
    shouldReset = true;
  }
});

runMigrations(shouldReset);
