import orchestrator from "tests/orchestrator";
//import database from "infra/database";
import { version as uuidVersion } from "uuid";
import user from "models/user.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          username: "ramon",
          email: "ramon@email.com",
          password: "senha123",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "ramon",
        email: "ramon@email.com",
        password: responseBody.password,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("ramon");

      const correctPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password,
      );

      const inCorrectPasswordMatch = await password.compare(
        "senhaErrada",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(inCorrectPasswordMatch).toBe(false);
    });
    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado1",
          email: "duplicado@email.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado2",
          email: "Duplicado@email.com",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O e-mail informado já está sendo utilizado",
        action: "Utilize outro e-mail para realizar esta operação",
        status_code: 400,
      });
    });

    test("With duplicated 'username'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          username: "usernameduplicado",
          email: "username1@email.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          username: "UsernameDuplicado",
          email: "username2@email.com",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado",
        action: "Utilize outro username para realizar esta operação",
        status_code: 400,
      });
    });
  });

  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);

      const user1SessionObject = await orchestrator.createSession(user1.id);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "usuariologado",
          email: "usuariologado@rsza.com.br",
          password: "senha123",
        }),
      });

      expect(user2Response.status).toBe(403);

      const user2ResponseBody = await user2Response.json();

      expect(user2ResponseBody).toEqual({
        name: "ForbiddenError",
        action: 'Verifique se o seu usuário possui a feature "create:user"',
        message: "Você não possui permissão para executar esta ação.",
        status_code: 403,
      });
    });
  });
});
