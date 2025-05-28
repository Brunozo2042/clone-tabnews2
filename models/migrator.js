import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";

const defaultMigrationsOptions = {
    dryRun: false,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
    let dbClient;
    try {
        dbClient = await database.getNewCliente();

        const pendingMigrations = await migrationRunner({
            ...defaultMigrationsOptions,
            dbClient,
        });
        return pendingMigrations;
    } finally {
        await dbClient?.end();
    }
}

async function runPendingMigrations() {
    let dbClient;
    try {
        dbClient = await database.getNewCliente();

        const migratedMigrations = await migrationRunner({
            ...defaultMigrationsOptions,
            dbClient,
            dryRun: false,
        });

        return migratedMigrations;
    } finally {
        await dbClient?.end();
    }
}

export const migrator = {
    listPendingMigrations,
    runPendingMigrations,
};
