import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");

      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action: `Verifique se o seu usuário possui a feature "read:migration"`,
      });
    });
  });

  describe("Default user", () => {
    describe("Running pending migrations", () => {
      test("Default user", async () => {
        const privilegedUser = await orchestrator.createUser();

        const activatedPrivilegedUser =
          await orchestrator.activateUser(privilegedUser);
        const privilegedUserSession = await orchestrator.createSession(
          activatedPrivilegedUser.id,
        );

        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "GET",
            headers: {
              "Content-type": "application/json",
              Cookie: `session_id=${privilegedUserSession.token}`,
            },
          },
        );
        expect(response.status).toBe(403);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          name: "ForbiddenError",
          status_code: 403,
          message: "Você não possui permissão para executar esta ação.",
          action: `Verifique se o seu usuário possui a feature "read:migration"`,
        });
      });
      test('Privileged user with "read:migration" feature', async () => {
        const privilegedUser = await orchestrator.createUser();

        const activatedPrivilegedUser =
          await orchestrator.activateUser(privilegedUser);
        const privilegedUserSession = await orchestrator.createSession(
          activatedPrivilegedUser.id,
        );
        await orchestrator.addFeaturesToUser(activatedPrivilegedUser, [
          "read:migration",
        ]);

        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "GET",
            headers: {
              "Content-type": "application/json",
              Cookie: `session_id=${privilegedUserSession.token}`,
            },
          },
        );

        expect(response.status).toBe(200);
        const responseBody = await response.json();

        expect(Array.isArray(responseBody)).toBe(true);
      });
    });
  });
});
