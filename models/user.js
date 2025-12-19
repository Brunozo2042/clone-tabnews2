import database from "infra/database";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneById(id) {
  const userFound = await runSelectQuery(id);

  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
        select
            *
        from 
            users
        where
            id = $1
        limit 
            1
        ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado.",
        action: "Verifique o id informado.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
            select
                *
            from 
                users
            where
                lower(username) = lower($1)
            limit 
                1
            ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Usuário não encontrado.",
        action: "Verifique o username informado.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
            select
                *
            from 
                users
            where
                lower(email) = lower($1)
            limit 
                1
            ;`,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Usuário não encontrado.",
        action: "Verifique o email informado.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
            insert into 
                users (username, email, password) 
            values 
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
    return results.rows[0];
  }
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updateUser = await runUpdateQuery(userWithNewValues);
  return updateUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
            update 
                users 
            set 
                username = $2, 
                email = $3,
                password = $4,
                updated_at = timezone('utc', now())
            where
                id = $1
            RETURNING
                *
            ;`,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });
    return results.rows[0];
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
            select
                email 
            from 
                users
            where
                lower(username) = lower($1)
            ;`,
    values: [username],
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está em uso.",
      action: "Utilize outro username para realizar esta operação",
    });
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
            select
                email 
            from 
                users
            where
                lower(email) = lower($1)
            ;`,
    values: [email],
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O Email informado já está em uso.",
      action: "Utilize outro email para realizar esta operação",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

const user = {
  create,
  findOneById,
  findOneByUsername,
  findOneByEmail,
  update,
};

export default user;
