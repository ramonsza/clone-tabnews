import webserver from "infra/webserver";
import activation from "models/activation.js";
import user from "models/user";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createdUserResponseBody;
  let activationTokenId;
  let createSessionResponseBody;

  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@rsza.com.br",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    createdUserResponseBody = await createUserResponse.json();

    expect(createdUserResponseBody).toEqual({
      id: createdUserResponseBody.id,
      username: "RegistrationFlow",
      features: ["read:activation_token"],
      created_at: createdUserResponseBody.created_at,
      updated_at: createdUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@rsza.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@rsza.com.br>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no RSZA");
    expect(lastEmail.text).toContain("RegistrationFlow");

    activationTokenId = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
    );

    const activationTokenObject =
      await activation.findOneValidById(activationTokenId);
    expect(activationTokenObject.user_id).toEqual(createdUserResponseBody.id);
    expect(activationTokenObject.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername("RegistrationFlow");
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const createSessionResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@rsza.com.br",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createSessionResponse.status).toBe(201);

    createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toBe(createdUserResponseBody.id);
  });

  test("Get user information", async () => {
    const userResponse = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        cookie: `session_id=${createSessionResponseBody.token}`,
      },
    });

    expect(userResponse.status).toBe(200);

    const userResponseBody = await userResponse.json();

    expect(userResponseBody.id).toBe(createdUserResponseBody.id);
  });
});
