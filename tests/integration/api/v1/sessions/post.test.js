import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import session from "models/session";
import setCookieParser from "set-cookie-parser";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  test("With incorrect `email` but correct `password`", async () => {
    await orchestrator.createUser({
      password: "senha_correta",
    });

    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "email.errado@gmail.com",
        password: "senha_correta",
      }),
    });

    expect(response.status).toBe(401);

    // Assert response body
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      name: "UnauthorizedError",
      message: "Dados de autenticação não conferem.",
      action: "Verifique se os dados enviados estão corretos.",
      statusCode: 401,
    });
  });

  test("With correct `email` but incorrect `password`", async () => {
    await orchestrator.createUser({
      email: "email.correto@gmail.com",
    });

    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "email.correto@gmail.com",
        password: "senha_incorreta",
      }),
    });

    expect(response.status).toBe(401);

    // Assert response body
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      name: "UnauthorizedError",
      message: "Dados de autenticação não conferem.",
      action: "Verifique se os dados enviados estão corretos.",
      statusCode: 401,
    });
  });

  test("With incorrect `email` and incorrect `password`", async () => {
    await orchestrator.createUser({});

    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "email.incorreto@gmail.com",
        password: "senha_incorreta",
      }),
    });

    expect(response.status).toBe(401);

    // Assert response body
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      name: "UnauthorizedError",
      message: "Dados de autenticação não conferem.",
      action: "Verifique se os dados enviados estão corretos.",
      statusCode: 401,
    });
  });

  test("With correct `email` and correct `password`", async () => {
    const createdUser = await orchestrator.createUser({
      email: "tudo.correto@gmail.com",
      password: "senha_correta",
    });

    await orchestrator.activateUser(createdUser);

    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "tudo.correto@gmail.com",
        password: "senha_correta",
      }),
    });

    expect(response.status).toBe(201);

    // Assert response body
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      id: responseBody.id,
      token: responseBody.token,
      user_id: createdUser.id,
      expires_at: responseBody.expires_at,
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });

    expect(uuidVersion(responseBody.id)).toBe(4);
    expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
    expect(Date.parse(responseBody.created_at)).not.toBeNaN();
    expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

    // `expires_at` é calculado na aplicação antes da persistência.
    // `created_at` é calculado depois na camada do banco de dados.
    // Por isso, o tempo real entre as duas datas pode ficar ligeiramente
    // menor do que o tempo de expiração configurado e não bater 30 dias nos
    // milissegundos caso seja calculado apenas `expires_at` - `created_at`.
    // Então a ideia é garantir que no momento `expires_at` seja maior que
    // `created_at`, e também que possa existir distância de até 5 segundo
    // entre as duas datas para cobrir o caso do banco sofrer algum load
    // inesperado nos testes.

    const expiresAt = new Date(responseBody.expires_at);
    const createdAt = new Date(responseBody.created_at);

    expect(expiresAt >= createdAt).toBe(true);

    const actualLifetimeInMilliseconds = expiresAt - createdAt;
    const lifetimeDifferenceInMilliseconds =
      session.EXPIRATION_IN_MILISECONDS - actualLifetimeInMilliseconds;

    expect(lifetimeDifferenceInMilliseconds).toBeLessThanOrEqual(5000);

    const parsedSetCookie = setCookieParser(response, { map: true });

    expect(parsedSetCookie.session_id).toEqual({
      name: "session_id",
      value: responseBody.token,
      maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });
  });
});
