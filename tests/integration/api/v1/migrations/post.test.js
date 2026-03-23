import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );

        expect(response.status).toBe(403);
        const responseBody = await response.json();

        expect(responseBody).toEqual({
          name: "ForbiddenError",
          status_code: 403,
          message: "Você não possui permissão para executar esta ação.",
          action: `Verifique se o seu usuário possui a feature "create:migration"`,
        });
      });
    });
  });

  describe("Default user", () => {
    describe("Running pending migrations", () => {
      test("User with `create:migration` feature", async () => {
        const privilegedUser = await orchestrator.createUser();

        const activatedPrivilegedUser =
          await orchestrator.activateUser(privilegedUser);
        const privilegedUserSession = await orchestrator.createSession(
          activatedPrivilegedUser.id,
        );
        await orchestrator.addFeaturesToUser(activatedPrivilegedUser, [
          "create:migration",
        ]);

        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
