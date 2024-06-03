import { up } from 'infra/migrations/1716483397901_test-migration';
import migrationRunner from 'node-pg-migrate'
import {join} from 'node:path'
import database from 'infra/database';

export default async function migrations(request, response) {
    const dbClient = await database.getNewCliente();
    const defaultMigrationsOptions = {
        dbClient: dbClient,
        dryRun: false,
        dir: join("infra","migrations"),
        direction: "up",
        verbose: true,
        migrationsTable: "pgmigrations"
    }

    if(request.method === "GET"){
        const pendingMigrations = await migrationRunner(defaultMigrationsOptions)
        await dbClient.end();
        return response.status(200).json(pendingMigrations);
    }
    
    if(request.method === "POST"){
        const migratedMigrations = await migrationRunner({
            ...defaultMigrationsOptions,
            dryRun: false,
    });

    await dbClient.end();

    if(migratedMigrations.length > 0){
        return response.status(201).json(migratedMigrations);
    }

        return response.status(200).json(migratedMigrations);
    }
    
    return response.status(405).end();
    
}