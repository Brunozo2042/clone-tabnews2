import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password";

beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendindMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
    describe("Anonymous user", () => {
        test("With nonexistence 'username'", async () => {
            const response = await fetch(
                "http://localhost:3000/api/v1/users/usuarioinexistente",
                {
                    method: "PATCH",
                },
            );

            expect(response.status).toBe(404);

            const responseBody = await response.json();

            expect(responseBody).toEqual({
                name: "NotFoundError",
                message: "Usuário não encontrado.",
                action: "Verifique o username informado.",
                statusCode: 404,
            });
        });

        test("With duplicated 'username'", async () => {
            await orchestrator.createUser({
                username: "user1",
            });

            await orchestrator.createUser({
                username: "user2",
            });

            const response = await fetch(
                "http://localhost:3000/api/v1/users/user2",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: "user1",
                    }),
                },
            );

            expect(response.status).toBe(400);

            const responseBody = await response.json();
            expect(responseBody).toEqual({
                name: "ValidationError",
                message: "O username informado já está em uso.",
                action: "Utilize outro username para realizar esta operação",
                statusCode: 400,
            });
        });

        test("With duplicated 'email'", async () => {
            await orchestrator.createUser({
                email: "email1@gmail.com",
            });

            const createdUser2 = await orchestrator.createUser({
                email: "email2@gmail.com",
            });

            const response = await fetch(
                `http://localhost:3000/api/v1/users/${createdUser2.username}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: "email1@gmail.com",
                    }),
                },
            );

            expect(response.status).toBe(400);

            const responseBody = await response.json();
            expect(responseBody).toEqual({
                name: "ValidationError",
                message: "O Email informado já está em uso.",
                action: "Utilize outro email para realizar esta operação",
                statusCode: 400,
            });
        });

        test("With unique 'username'", async () => {
            const createduser = await orchestrator.createUser({});

            const response = await fetch(
                `http://localhost:3000/api/v1/users/${createduser.username}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: "uniqueUser2",
                    }),
                },
            );

            expect(response.status).toBe(200);

            const responseBody = await response.json();
            expect(responseBody).toEqual({
                id: responseBody.id,
                username: "uniqueUser2",
                email: createduser.email,
                password: responseBody.password,
                created_at: responseBody.created_at,
                updated_at: responseBody.updated_at,
            });

            expect(uuidVersion(responseBody.id)).toBe(4);
            expect(Date.parse(responseBody.created_at)).not.toBeNaN();
            expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

            expect(responseBody.updated_at > responseBody.created_at).toBe(
                true,
            );
        });

        test("With unique 'email'", async () => {
            const createdUser = await orchestrator.createUser({});

            const response = await fetch(
                `http://localhost:3000/api/v1/users/${createdUser.username}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: "uniqueEmail2@gmail.com",
                    }),
                },
            );

            expect(response.status).toBe(200);

            const responseBody = await response.json();
            expect(responseBody).toEqual({
                id: responseBody.id,
                username: createdUser.username,
                email: "uniqueEmail2@gmail.com",
                password: responseBody.password,
                created_at: responseBody.created_at,
                updated_at: responseBody.updated_at,
            });

            expect(uuidVersion(responseBody.id)).toBe(4);
            expect(Date.parse(responseBody.created_at)).not.toBeNaN();
            expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

            expect(responseBody.updated_at > responseBody.created_at).toBe(
                true,
            );
        });

        test("With new 'password'", async () => {
            const createdUser = await orchestrator.createUser({
                password: "newPassword1",
            });

            const response = await fetch(
                `http://localhost:3000/api/v1/users/${createdUser.username}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        password: "newPassword2",
                    }),
                },
            );

            expect(response.status).toBe(200);

            const responseBody = await response.json();
            expect(responseBody).toEqual({
                id: responseBody.id,
                username: createdUser.username,
                email: createdUser.email,
                password: responseBody.password,
                created_at: responseBody.created_at,
                updated_at: responseBody.updated_at,
            });

            expect(uuidVersion(responseBody.id)).toBe(4);
            expect(Date.parse(responseBody.created_at)).not.toBeNaN();
            expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

            expect(responseBody.updated_at > responseBody.created_at).toBe(
                true,
            );

            const userInDatabase = await user.findOneByUsername(
                createdUser.username,
            );
            const correctPasswordMatch = await password.compare(
                "newPassword2",
                userInDatabase.password,
            );

            const incorrectPasswordMatch = await password.compare(
                "newPassword1",
                userInDatabase.password,
            );

            expect(correctPasswordMatch).toBe(true);
            expect(incorrectPasswordMatch).toBe(false);
        });
    });
});
