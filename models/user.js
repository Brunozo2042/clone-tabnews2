import database from "infra/database";
import { ValidationError } from "infra/errors.js";

async function create(userInputValues) {
    await validateUniqueEmail(userInputValues.email);
    await validateUniqueUsername(userInputValues.username);

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
};

export default user;
