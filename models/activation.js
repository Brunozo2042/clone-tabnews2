import email from "infra/email.js";
import database from "infra/database";
import webserver from "infra/webserver.js";
import { ForbiddenError, NotFoundError } from "infra/errors";
import user from "./user";
import authorization from "./authorization";

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

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
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

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(activationTokenId) {
    const result = await database.query({
      text: `
        UPDATE 
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [activationTokenId],
    });
    return result.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar token de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  const actvatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
    "update:user",
  ]);
  return actvatedUser;
}

const activation = {
  findOneValidById,
  create,
  sendEmailToUser,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILISECONDS,
};

export default activation;
