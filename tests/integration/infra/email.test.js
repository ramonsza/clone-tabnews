import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteEmails();
    await email.send({
      from: "Ramon <ramon@rsza.com.br",
      to: "contato@rsza.com.br",
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "Ramon <ramon@rsza.com.br",
      to: "contato@rsza.com.br",
      subject: "Último email enviado",
      text: "Corpo do último e-mail",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<ramon@rsza.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contato@rsza.com.br>");
    expect(lastEmail.subject).toBe("Último email enviado");
    expect(lastEmail.text).toBe("Corpo do último e-mail\r\n");
  });
});
