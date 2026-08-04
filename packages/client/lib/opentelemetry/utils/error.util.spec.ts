import { strict as assert } from "node:assert";

import { ERROR_CATEGORY } from "../types";
import { getErrorInfo } from "./error.util";
import {
  ConnectionTimeoutError,
  SocketTimeoutError,
  SocketClosedUnexpectedlyError,
  ReconnectStrategyError,
  SocketTimeoutDuringMaintenanceError,
  CommandTimeoutDuringMaintenanceError,
  SimpleError,
  BlobError,
} from "../../errors";

describe("getErrorInfo", () => {
  describe("network errors", () => {
    it("should return correct info for ConnectionTimeoutError", () => {
      const error = new ConnectionTimeoutError();
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "ConnectionTimeoutError");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for SocketTimeoutError", () => {
      const error = new SocketTimeoutError(5000);
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "SocketTimeoutError");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for SocketClosedUnexpectedlyError", () => {
      const error = new SocketClosedUnexpectedlyError();
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "SocketClosedUnexpectedlyError");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for SocketTimeoutDuringMaintenanceError", () => {
      const error = new SocketTimeoutDuringMaintenanceError(5000);
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "SocketTimeoutDuringMaintenanceError");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for CommandTimeoutDuringMaintenanceError", () => {
      const error = new CommandTimeoutDuringMaintenanceError(5000);
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "CommandTimeoutDuringMaintenanceError");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for ECONNREFUSED error", () => {
      const error = new Error("Connection refused") as NodeJS.ErrnoException;
      error.code = "ECONNREFUSED";
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for ETIMEDOUT error", () => {
      const error = new Error("Connection timed out") as NodeJS.ErrnoException;
      error.code = "ETIMEDOUT";
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for ENOTFOUND error", () => {
      const error = new Error("DNS lookup failed") as NodeJS.ErrnoException;
      error.code = "ENOTFOUND";
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for ECONNRESET error", () => {
      const error = new Error("Connection reset") as NodeJS.ErrnoException;
      error.code = "ECONNRESET";
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });
  });

  describe("TLS errors", () => {
    it("should return correct info for CERT_HAS_EXPIRED error", () => {
      const error = new Error("Certificate expired") as NodeJS.ErrnoException;
      error.code = "CERT_HAS_EXPIRED";
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.TLS);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for DEPTH_ZERO_SELF_SIGNED_CERT error", () => {
      const error = new Error("Self-signed cert") as NodeJS.ErrnoException;
      error.code = "DEPTH_ZERO_SELF_SIGNED_CERT";
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.TLS);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for error with certificate in message", () => {
      const error = new Error("Unable to verify the first certificate");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.TLS);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for error with handshake in message", () => {
      const error = new Error("TLS handshake failed");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.TLS);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for error with SSL in message", () => {
      const error = new Error("SSL connection error");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.TLS);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for error with TLS in message", () => {
      const error = new Error("TLS protocol error");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.TLS);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });
  });

  describe("auth errors", () => {
    it("should return correct info for NOAUTH ErrorReply", () => {
      const error = new SimpleError("NOAUTH Authentication required");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.AUTH);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "NOAUTH");
    });

    it("should return correct info for WRONGPASS ErrorReply", () => {
      const error = new SimpleError("WRONGPASS invalid username-password pair");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.AUTH);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "WRONGPASS");
    });

    it("should return correct info for NOPERM ErrorReply", () => {
      const error = new SimpleError(
        "NOPERM this user has no permissions to run the command",
      );
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.AUTH);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "NOPERM");
    });
  });

  describe("server errors", () => {
    it("should return correct info for OOM ErrorReply", () => {
      const error = new SimpleError(
        "OOM command not allowed when used memory > maxmemory",
      );
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "OOM");
    });

    it("should return correct info for READONLY ErrorReply", () => {
      const error = new SimpleError(
        "READONLY You can't write against a read only replica",
      );
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "READONLY");
    });

    it("should return correct info for CLUSTERDOWN ErrorReply", () => {
      const error = new SimpleError("CLUSTERDOWN The cluster is down");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "CLUSTERDOWN");
    });

    it("should return correct info for LOADING ErrorReply", () => {
      const error = new SimpleError(
        "LOADING Redis is loading the dataset in memory",
      );
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "LOADING");
    });

    it("should return correct info for BUSY ErrorReply", () => {
      const error = new SimpleError("BUSY Redis is busy running a script");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "BUSY");
    });

    it("should return correct info for MASTERDOWN ErrorReply", () => {
      const error = new SimpleError("MASTERDOWN Link with MASTER is down");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "MASTERDOWN");
    });

    it("should return correct info for MOVED ErrorReply", () => {
      const error = new SimpleError("MOVED 3999 127.0.0.1:6381");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "MOVED");
    });

    it("should return correct info for ASK ErrorReply", () => {
      const error = new SimpleError("ASK 3999 127.0.0.1:6381");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "ASK");
    });

    it("should return correct info for ERR ErrorReply", () => {
      const error = new SimpleError("ERR unknown command 'FOOBAR'");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "ERR");
    });

    it("should return correct info for WRONGTYPE ErrorReply", () => {
      const error = new SimpleError(
        "WRONGTYPE Operation against a key holding the wrong kind of value",
      );
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.SERVER);
      assert.strictEqual(info.errorType, "SimpleError");
      assert.strictEqual(info.statusCode, "WRONGTYPE");
    });
  });

  describe("other errors", () => {
    it("should return correct info for generic Error", () => {
      const error = new Error("Something went wrong");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return correct info for BlobError without known prefix", () => {
      const error = new BlobError("Some blob error message");
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "BlobError");
      assert.strictEqual(info.statusCode, undefined);
    });
  });

  describe("ReconnectStrategyError", () => {
    it("should unwrap and return info for originalError (network)", () => {
      const originalError = new ConnectionTimeoutError();
      const error = new ReconnectStrategyError(originalError, null);
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.NETWORK);
      assert.strictEqual(info.errorType, "ConnectionTimeoutError");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should unwrap and return info for originalError (other)", () => {
      const originalError = new Error("Generic error");
      const error = new ReconnectStrategyError(originalError, null);
      const info = getErrorInfo(error);
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "Error");
      assert.strictEqual(info.statusCode, undefined);
    });
  });

  describe("non-Error values", () => {
    it("should return unknown for string", () => {
      const info = getErrorInfo("error string");
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "unknown");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return unknown for number", () => {
      const info = getErrorInfo(42);
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "unknown");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return unknown for null", () => {
      const info = getErrorInfo(null);
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "unknown");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return unknown for undefined", () => {
      const info = getErrorInfo(undefined);
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "unknown");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return unknown for plain object", () => {
      const info = getErrorInfo({ message: "error" });
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "unknown");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return unknown for array", () => {
      const info = getErrorInfo(["error"]);
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "unknown");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return unknown for boolean", () => {
      const info = getErrorInfo(true);
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "unknown");
      assert.strictEqual(info.statusCode, undefined);
    });

    it("should return unknown for symbol", () => {
      const info = getErrorInfo(Symbol("error"));
      assert.strictEqual(info.category, ERROR_CATEGORY.OTHER);
      assert.strictEqual(info.errorType, "unknown");
      assert.strictEqual(info.statusCode, undefined);
    });
  });
});
