import assert from "node:assert";
import { createClient } from "../../";

describe("EnterpriseMaintenanceManager does not prevent proper options parsing", () => {
  it("should not throw when initializing without options", async () => {
    const client = createClient();
    assert.doesNotThrow(async () => {
      //Expected to reject because there is no url or socket provided and there is no running server on localhost
      await assert.rejects(client.connect);
    });
  });

  it("should not throw when initializing without url/socket and with maint", async () => {
    const client = createClient({
      maintNotifications: "enabled",
      RESP: 3,
    });
    assert.doesNotThrow(async () => {
      //Expected to reject because there is no url or socket provided and there is no running server on localhost
      await assert.rejects(client.connect);
    });
  });
  it("should not throw when initializing with url and with maint", async () => {
    const client = createClient({
      maintNotifications: "enabled",
      RESP: 3,
      url: "redis://localhost:6379",
    });
    assert.doesNotThrow(async () => {
      //Expected to reject because there is no url or socket provided and there is no running server on localhost
      await assert.rejects(client.connect);
    });
  });

  it("should not throw when initializing with socket and with maint", async () => {
    const client = createClient({
      maintNotifications: "enabled",
      RESP: 3,
      socket: {
        host: "localhost",
        port: 6379,
      },
    });
    assert.doesNotThrow(async () => {
      //Expected to reject because there is no url or socket provided and there is no running server on localhost
      await assert.rejects(client.connect);
    });
  });
});
