import { Client } from 'pg'

//comando para inicializar o serviço do banco de dados
//docker compose -f infra/compose.yaml up -d

async function query(queryObject) {
    const client = new Client({
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        ssl:getSSLValues()
    });
    
    try {
        await client.connect();
        const result = await client.query(queryObject);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await client.end();
    }
}

export default {
    query: query
};

function getSSLValues() {
    if (process.env.POSTGRES_CA) {
      return {
        ca: process.env.POSTGRES_CA,
      };
    }
  
    return process.env.NODE_ENV === "production" ? true : false;
  }