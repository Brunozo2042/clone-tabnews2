import database from "infra/database.js"

// para validar os testes é necessário o servidor web e 
// o serviço do banco de dados estarem rodando

//comando para inicializar o servidor web
//npm run dev

async function status(request, response) {
    //Data
    const updatedAt = new Date().toISOString();

    const dbVersion = await database.query("SHOW server_version;");
    const dbMaxCon = await database.query("SHOW max_connections;");
    const dbUsedCon = await database.query("SELECT count(*) AS conexoes_ativas FROM pg_stat_activity;");

    console.log(dbMaxCon.rows[0].max_connections);


    //Versão do postgress
    const pgVersion = dbVersion.rows[0].server_version;

    //Conexões máximas
    const maxConections = parseInt(dbMaxCon.rows[0].max_connections);

    //Conexões abertas
    const openedConnections = parseInt(dbUsedCon.rows[0].conexoes_ativas);

    response.status(200).json({
        updated_at: updatedAt,
        dependecies: {
            database: {
                version: pgVersion,
                max_conections: maxConections,
                opened_connections: openedConnections,
            }
        }
    });
}

export default status;