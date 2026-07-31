import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingtoGet = request.context.user;
  //Data
  const updatedAt = new Date().toISOString();
  const dbName = process.env.POSTGRES_DB;

  const dbVersion = await database.query("SHOW server_version;");
  const dbMaxCon = await database.query("SHOW max_connections;");
  const dbUsedCon = await database.query({
    text: "SELECT count(*) AS conexoes_ativas FROM pg_stat_activity WHERE datname = $1;",
    values: [dbName],
  });

  //Versão do postgress
  const pgVersion = dbVersion.rows[0].server_version;

  //Conexões máximas
  const maxConections = parseInt(dbMaxCon.rows[0].max_connections);

  //Conexões abertas
  const openedConnections = parseInt(dbUsedCon.rows[0].conexoes_ativas);

  const statusObject = {
    updated_at: updatedAt,
    dependecies: {
      database: {
        version: pgVersion,
        max_connections: maxConections,
        opened_connections: openedConnections,
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingtoGet,
    "read:status",
    statusObject,
  );

  response.status(200).json(secureOutputValues);
}
