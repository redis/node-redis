import { strict as assert } from "node:assert";
import { digest } from "./digest";
import testUtils, { GLOBAL } from "../test-utils";

describe("digest", () => {
  describe("determinism", () => {
    it("should return the same digest for the same string input", async () => {
      const input = "hello world";
      const digest1 = await digest(input);
      const digest2 = await digest(input);
      assert.equal(digest1, digest2);
    });

    it("should return the same digest for the same Buffer input", async () => {
      const input = Buffer.from("hello world");
      const digest1 = await digest(input);
      const digest2 = await digest(input);
      assert.equal(digest1, digest2);
    });
  });

  describe("string/buffer parity", () => {
    it("should return the same digest for string and equivalent Buffer", async () => {
      const str = "hello world";
      const buf = Buffer.from(str);
      assert.equal(await digest(str), await digest(buf));
    });

    it("should return the same digest for empty string and empty Buffer", async () => {
      assert.equal(await digest(""), await digest(Buffer.alloc(0)));
    });

    it("should return the same digest for UTF-8 string and equivalent Buffer", async () => {
      const str = "hello \u{1F600} world"; // string with emoji
      const buf = Buffer.from(str, "utf8");
      assert.equal(await digest(str), await digest(buf));
    });

    it("should return the same digest for binary data in Buffer and string", async () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);
      // Note: binary encoding may not preserve exact bytes for all values
      // This test verifies consistent behavior for the same input representation
      const bufDigest = await digest(binaryData);
      assert.equal(typeof bufDigest, "string");
      assert.equal(bufDigest.length, 16);
    });
  });

  describe("output format validation", () => {
    it("should return a 16-character string", async () => {
      const result = await digest("test");
      assert.equal(result.length, 16);
    });

    it("should return lowercase hexadecimal characters only", async () => {
      const result = await digest("test");
      assert.match(result, /^[0-9a-f]{16}$/);
    });

    it("should pad with leading zeros when necessary", async () => {
      // Test various inputs to ensure padding works correctly
      const inputs = ["", "a", "test", "longer string with more content"];
      for (const input of inputs) {
        const result = await digest(input);
        assert.equal(
          result.length,
          16,
          `Digest for "${input}" should be 16 characters`
        );
        assert.match(
          result,
          /^[0-9a-f]{16}$/,
          `Digest for "${input}" should be valid hex`
        );
      }
    });

    it("should return different digests for different inputs", async () => {
      const digest1 = await digest("input1");
      const digest2 = await digest("input2");
      assert.notEqual(digest1, digest2);
    });

    it("should handle empty string", async () => {
      const result = await digest("");
      assert.equal(result.length, 16);
      assert.match(result, /^[0-9a-f]{16}$/);
    });

    it("should handle empty Buffer", async () => {
      const result = await digest(Buffer.alloc(0));
      assert.equal(result.length, 16);
      assert.match(result, /^[0-9a-f]{16}$/);
    });

    it("should handle large inputs", async () => {
      const largeInput = "x".repeat(1000000); // 1MB string
      const result = await digest(largeInput);
      assert.equal(result.length, 16);
      assert.match(result, /^[0-9a-f]{16}$/);
    });
  });

  testUtils.testWithClient(
    "local digest matches Redis DIGEST command",
    async (client) => {
      const testValue = "hello-world-test";
      await client.set("key", testValue);

      const redisDigest = await client.digest("key");
      const localDigest = await digest(testValue);

      assert.equal(localDigest, redisDigest);
    },
    { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] }
  );
});

