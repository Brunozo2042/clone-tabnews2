import email from "infra/email.js";
import database from "infra/database";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors";

const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 minutos

async function findOneValidById(tokenId) {
  const activationTokenObject = await runSelectQuery(tokenId);
  return activationTokenObject;

  async function runSelectQuery(tokenId) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > now()
          AND used_at IS NULL
        LIMIT 1
      ;`,
      values: [tokenId],
    });

    if(result.rowsCount === 0) {
      throw new NotFoundError({
        message: "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro",
      });
    }

    return result.rows[0];
  }
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);
  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
      INSERT INTO 
        user_activation_tokens (user_id, expires_at)
      VALUES 
        ($1, $2)
      RETURNING
        *
    ;`,
      values: [userId, expiresAt],
    });
    return result.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "teste@teste.com.br",
    to: user.email,
    subject: "Ative seu cadastro no FinTab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro: 

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente, equipe FinTab
    `,
  });
}

const activation = {
  findOneValidById,
  create,
  sendEmailToUser,
};

export default activation;
