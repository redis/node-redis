import { strict as assert } from "node:assert";
import { ClientRegistry, ClientMetricsHandle } from "./client-registry";
import { ClientRole } from "../client/identity";
import testUtils, { GLOBAL } from "../test-utils";
// ! Import `createClient` from the same package as test-utils to ensure the client also uses the singleton
import { createClient } from "@redis/client/index";

function createMockHandle(id: string): ClientMetricsHandle {
  return {
    identity: { id, role: ClientRole.STANDALONE },
    getAttributes: () => ({
      host: "127.0.0.1",
      port: 6379,
      db: 0,
      clientId: id,
    }),
    getPendingRequests: () => 0,
    getCacheItemCount: () => 0,
    isConnected: () => true,
  };
}

describe("ClientRegistry Unit Tests", () => {
  afterEach(() => {
    ClientRegistry.reset();
  });

  it("should start as not initialized", () => {
    assert.strictEqual(ClientRegistry.isInitialized(), false);
  });

  it("should be initialized after init()", () => {
    ClientRegistry.init();
    assert.strictEqual(ClientRegistry.isInitialized(), true);
  });

  it("should allow multiple init() calls without error", () => {
    ClientRegistry.init();
    ClientRegistry.init();
    assert.strictEqual(ClientRegistry.isInitialized(), true);
  });

  it("should return empty iterable when not initialized (noop)", () => {
    const handle = createMockHandle("test-client-1");
    ClientRegistry.instance.register(handle);

    const clients = Array.from(ClientRegistry.instance.getAll());
    assert.strictEqual(clients.length, 0);
  });

  it("should register and retrieve clients after init", () => {
    ClientRegistry.init();
    const handle = createMockHandle("test-client-1");

    ClientRegistry.instance.register(handle);

    const clients = Array.from(ClientRegistry.instance.getAll());
    assert.strictEqual(clients.length, 1);
    assert.strictEqual(clients[0].identity.id, "test-client-1");
  });

  it("should unregister clients by id", () => {
    ClientRegistry.init();
    const handle = createMockHandle("test-client-1");

    ClientRegistry.instance.register(handle);
    ClientRegistry.instance.unregister("test-client-1");

    const clients = Array.from(ClientRegistry.instance.getAll());
    assert.strictEqual(clients.length, 0);
  });

  it("should handle multiple clients", () => {
    ClientRegistry.init();
    const handle1 = createMockHandle("client-1");
    const handle2 = createMockHandle("client-2");

    ClientRegistry.instance.register(handle1);
    ClientRegistry.instance.register(handle2);

    const clients = Array.from(ClientRegistry.instance.getAll());
    assert.strictEqual(clients.length, 2);
  });

  it("should reset to noop state", () => {
    ClientRegistry.init();
    const handle = createMockHandle("test-client");
    ClientRegistry.instance.register(handle);

    ClientRegistry.reset();

    assert.strictEqual(ClientRegistry.isInitialized(), false);
    const clients = Array.from(ClientRegistry.instance.getAll());
    assert.strictEqual(clients.length, 0);
  });

  it("should not throw when unregistering non-existent client", () => {
    ClientRegistry.init();
    assert.doesNotThrow(() => {
      ClientRegistry.instance.unregister("non-existent-id");
    });
  });
});

describe("ClientRegistry E2E", function () {
  this.timeout(5000);

  beforeEach(() => {
    ClientRegistry.init();
  });

  afterEach(() => {
    ClientRegistry.reset();
  });

  testUtils.testWithClient(
    "should register client on creation",
    async (client) => {
      const clients = Array.from(ClientRegistry.instance.getAll());
      assert.strictEqual(clients.length, 1);
      assert.strictEqual(clients[0].identity.role, ClientRole.STANDALONE);

      // Create a duplicate client
      // No need to connect it or keep a reference to it
      client.duplicate();

      assert.strictEqual(
        Array.from(ClientRegistry.instance.getAll()).length,
        2,
      );

      // Create a new client
      // No need to connect it or keep a reference to it
      createClient();

      assert.strictEqual(
        Array.from(ClientRegistry.instance.getAll()).length,
        3,
      );
    },
    {
      ...GLOBAL.SERVERS.OPEN,
    },
  );

  for (const method of ["close", "destroy", "disconnect", "quit"] as const) {
    testUtils.testWithClient(
      `should unregister client on ${method}`,
      async (client) => {
        assert.strictEqual(
          Array.from(ClientRegistry.instance.getAll()).length,
          1,
        );

        client[method]();
        assert.strictEqual(
          Array.from(ClientRegistry.instance.getAll()).length,
          0,
        );
      },
      {
        ...GLOBAL.SERVERS.OPEN,
      },
    );
  }

  testUtils.testWithClient(
    "should return correct attributes from handle",
    async (client) => {
      const clients = Array.from(ClientRegistry.instance.getAll());
      assert.strictEqual(clients.length, 1);

      const attributes = clients[0].getAttributes();
      // TODO this assertion might be flaky
      assert.ok(
        ["127.0.0.1", "localhost", "::1"].includes(attributes.host as string),
        `Expected host to be 127.0.0.1 or localhost or ::1, got ${attributes.host}`,
      );
      assert.ok(attributes.host, "Expected host to be defined");

      const { port } = client.options.socket as any;

      assert.strictEqual(attributes.port, port);
      assert.strictEqual(attributes.db, 0);
    },
    {
      ...GLOBAL.SERVERS.OPEN,
    },
  );
});
