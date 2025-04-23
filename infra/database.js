import { Client } from "pg";
import { ServiceError } from "./errors";

//comando para inicializar o serviço do banco de dados
//docker compose -f infra/compose.yaml up -d

async function query(queryObject) {
    let client;
    try {
        client = await getNewCliente();
        const result = await client.query(queryObject);
        return result;
    } catch (error) {
        const serviceErrorObject = new ServiceError({
            cause: error,
            message: "Erro ao executar a query no banco de dados.",
        });
        throw serviceErrorObject;
    } finally {
        await client?.end();
    }
}

async function getNewCliente() {
    const client = new Client({
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        ssl: getSSLValues(),
    });

    await client.connect();
    return client;
}

const database = {
    query,
    getNewCliente,
};

export default database;

function getSSLValues() {
    if (process.env.POSTGRES_CA) {
        return {
            ca: process.env.POSTGRES_CA,
        };
    }

    return process.env.NODE_ENV === "production" ? true : false;
}
