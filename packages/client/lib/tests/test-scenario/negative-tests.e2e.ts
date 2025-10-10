import assert from "assert";
import { createClient } from "../../..";

describe("Negative tests", () => {
  it("should only be enabled with RESP3", () => {
    assert.throws(
      () =>
        createClient({
          RESP: 2,
          maintNotifications: "enabled",
        }),
      "Error: Graceful Maintenance is only supported with RESP3",
    );
  });
});
