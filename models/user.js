import database from "infra/database";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const result = await database.query({
      text: `
        SELECT 
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT
          1
        ;`,
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema",
        action: "Verifique se o username está digitado corretamente",
      });
    }
    return result.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);
  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function validateUniqueEmail(email) {
    const result = await database.query({
      text: `
        SELECT 
          email
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
        ;`,
      values: [email],
    });

    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "O e-mail informado já está sendo utilizado",
        action: "Utilize outro e-mail para realizar o cadastro",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const result = await database.query({
      text: `
        SELECT 
          username
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        ;`,
      values: [username],
    });

    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "O username informado já está sendo utilizado",
        action: "Utilize outro username para realizar o cadastro",
      });
    }
  }

  async function runInsertQuery(userInputValues) {
    const result = await database.query({
      text: `
        INSERT INTO 
          users (username, email, password) 
          VALUES
           ($1, $2, $3)
          RETURNING
            *
          ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return result.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
