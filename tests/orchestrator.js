// script para aguarda algum outro serviço finalizar para executar outro
import retry from "async-retry";
import { faker } from "@faker-js/faker";
import database from "infra/database";
import { migrator } from "models/migrator";
import user from "models/user";

async function waitForAllServices() {
    await waitForWebServer();

    async function waitForWebServer() {
        return retry(fetchStatusPage, {
            retries: 100,
            maxTimeout: 1000,
        });

        async function fetchStatusPage() {
            const response = await fetch("http://localhost:3000/api/v1/status");
            // const responseBody = await response.json();
            if (response.status !== 200) {
                throw Error();
            }
        }
    }
}

async function clearDatabase() {
    await database.query("drop schema public cascade; create schema public");
}

async function runPendindMigrations() {
    await migrator.runPendingMigrations();
}

async function createUser(userObject) {
    return await user.create({
        username:
            userObject.username ||
            faker.internet.username().replace(/[_.-]/g, ""),
        email: userObject.email || faker.internet.email(),
        password: userObject.password || "validPassword",
    });
}

const orchestrator = {
    waitForAllServices,
    clearDatabase,
    runPendindMigrations,
    createUser,
};

export default orchestrator;
