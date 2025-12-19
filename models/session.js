import crypto from "node:crypto";
import db from "infra/database";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 days

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    const result = await db.query({
      text: `
        INSERT INTO 
          sessions (token, user_id, expires_at)
        VALUES 
          ($1, $2, $3)
        RETURNING 
          *
      `,
      values: [token, userId, expiresAt],
    });

    return result.rows[0];
  }
}

async function findOneValidByToken(token) {
  const sessionFound = await runSelectQuery(token);
  return sessionFound;

  async function runSelectQuery(token) {
    const result = await db.query({
      text: `
        SELECT 
          *
        FROM 
          sessions
        WHERE 
          token = $1
          AND expires_at > NOW()
        LIMIT 
          1
      `,
      values: [token],
    });

    if (result.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário esta logado e tente novamente.",
      });
    }

    return result.rows[0];
  }
}

async function renew(sessionId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const renewedSessionObject = await runUpdateQuery(sessionId, expiresAt);
  return renewedSessionObject;

  async function runUpdateQuery(sessionId, expiresAt) {
    const result = await db.query({
      text: `
        UPDATE 
          sessions
        SET 
          expires_at = $1,
          updated_at = NOW()
        WHERE 
          id = $2
        RETURNING 
          *
      ;`,
      values: [expiresAt, sessionId],
    });

    return result.rows[0];
  }
}

const session = {
  create,
  findOneValidByToken,
  renew,
  EXPIRATION_IN_MILISECONDS,
};

export default session;
