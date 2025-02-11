import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
    await orchestrator.waitForAllServices();
});

describe("POST /api/v1/migrations", () => {
    describe("Anonymous user", () => {
        test("Retrieving current system status", async () => {
            const response = await fetch("http://localhost:3000/api/v1/status");
            expect(response.status).toBe(200);

            const responseBody = await response.json();
            // console.log(responseBody);
            expect(responseBody.updated_at).toBeDefined();

            const parseUpdatedAt = new Date(
                responseBody.updated_at,
            ).toISOString();
            expect(responseBody.updated_at).toEqual(parseUpdatedAt);

            expect(responseBody.dependecies.database.version).toEqual("16.0");
            expect(responseBody.dependecies.database.max_connections).toEqual(
                100,
            );
            expect(
                responseBody.dependecies.database.opened_connections,
            ).toEqual(1);
        });
    });
});
