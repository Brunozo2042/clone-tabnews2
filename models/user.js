import database from "infra/database";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

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

async function create(userInputValues) {
    await validateUniqueEmail(userInputValues.email);
    await validateUniqueUsername(userInputValues.username);
    await hashPasswordInObject(userInputValues);

    const newUser = await runInsertQuery(userInputValues);
    return newUser;

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
                action: "Utilize outro username para realizar o cadastro",
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
                action: "Utilize outro email para realizar o cadastro",
            });
        }
    }

    async function hashPasswordInObject(userInputValues) {
        const hashedPassword = await password.hash(userInputValues.password);
        userInputValues.password = hashedPassword;
    }

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

const user = {
    create,
    findOneByUsername,
};

export default user;
