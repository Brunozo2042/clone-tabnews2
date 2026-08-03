import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/status`);
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      // console.log(responseBody);
      expect(responseBody.updated_at).toBeDefined();

      const parseUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parseUpdatedAt);

      expect(responseBody.dependecies.database).not.toHaveProperty("version");
      expect(responseBody.dependecies.database.max_connections).toEqual(100);
      expect(responseBody.dependecies.database.opened_connections).toEqual(1);
    });
  });

  describe("Default user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      // console.log(responseBody);
      expect(responseBody.updated_at).toBeDefined();

      const parseUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parseUpdatedAt);

      expect(responseBody.dependecies.database).not.toHaveProperty("version");
      expect(responseBody.dependecies.database.max_connections).toEqual(100);
      expect(responseBody.dependecies.database.opened_connections).toEqual(1);
    });
  });

  describe("Privileged user", () => {
    test("With `read:status:all`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      await orchestrator.addFeatureToUser(createdUser, ["read:status:all"]);
      const sessionObject = await orchestrator.createSession(activatedUser);
      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      // console.log(responseBody);
      expect(responseBody.updated_at).toBeDefined();

      const parseUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parseUpdatedAt);

      expect(responseBody.dependecies.database.version).toEqual("16.0");
      expect(responseBody.dependecies.database.max_connections).toEqual(100);
      expect(responseBody.dependecies.database.opened_connections).toEqual(1);
    });
  });
});
