import { Client } from 'pg'

//comando para inicializar o serviço do banco de dados
//docker compose -f infra/compose.yaml up -d

async function query(queryObject) {
    const client = new Client({
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD
    });
    await client.connect();

    try {
        const result = await client.query(queryObject);
        return result;
    } catch (error) {
        console.error(error)
    } finally {
        await client.end();
    }
}

export default {
    query: query
};