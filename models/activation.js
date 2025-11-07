import database from "infra/database.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors";
import user from "models/user";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);

  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
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

    return results.rows[0];
  }
}

async function findOneByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
      LIMIT
        1
    ;`,
    values: [userId],
  });

  return results.rows[0];
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Contato RSZA <contato@rsza.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no RSZA",
    text: `${user.username}, click no link abaixo para ativar seu cadastro
    
${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe RSZA
    `,
  });
}

async function findOneValidById(token) {
  const results = await database.query({
    text: `
        SELECT
          *
        FROM 
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
      ;`,
    values: [token],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Token inválido ou expirado",
      action: "Faça um novo cadastro",
    });
  }

  return results.rows[0];
}

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(activationTokenId) {
    const results = await database.query({
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

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  create,
  findOneByUserId,
  sendEmailToUser,
  findOneValidById,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;
