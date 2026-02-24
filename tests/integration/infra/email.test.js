import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Teste <teste@teste.com.br>",
      to: "teste@teste.com.br",
      subject: "Teste de assunto",
      text: "teste de texto",
    });
    await email.send({
      from: "Teste <teste@teste.com.br>",
      to: "teste@teste.com.br",
      subject: "ultimo email",
      text: "corpo do ultimo email",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<teste@teste.com.br>");
    expect(lastEmail.recipients[0]).toBe("<teste@teste.com.br>");
    expect(lastEmail.subject).toBe("ultimo email");
    expect(lastEmail.text).toBe("corpo do ultimo email\n");
  });
});
