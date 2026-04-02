import { strict as assert } from "node:assert";
import dc from "node:diagnostics_channel";

import * as api from "@opentelemetry/api";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { OTelTracing } from "./tracing";
import { OTEL_ATTRIBUTES } from "./types";

describe("OTelTracing", () => {
  let exporter: InMemorySpanExporter;
  let provider: BasicTracerProvider;

  let contextManager: AsyncLocalStorageContextManager;

  beforeEach(() => {
    contextManager = new AsyncLocalStorageContextManager().enable();
    api.context.setGlobalContextManager(contextManager);

    exporter = new InMemorySpanExporter();
    provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    api.trace.setGlobalTracerProvider(provider);
  });

  afterEach(async () => {
    OTelTracing.reset();
    await provider.shutdown();
    api.trace.disable();
    api.context.disable();
  });

  describe("command spans", () => {
    it("should create a span for a command", async () => {
      OTelTracing.init({ api, config: { enabled: true } });

      const tc = dc.tracingChannel("node-redis:command");
      const ctx = {
        command: "SET",
        args: ["SET", "mykey", "?"],
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test-client",
      };

      await tc.tracePromise(async () => {}, ctx);

      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();

      assert.equal(spans.length, 1);
      assert.equal(spans[0].name, "SET");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.dbOperationName], "SET");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.dbNamespace], "0");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.serverAddress], "localhost");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.serverPort], 6379);
      assert.equal(spans[0].attributes["db.query.text"], "SET mykey ?");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.dbSystemName], "redis");
    });

    it("should record errors on command spans", async () => {
      OTelTracing.init({ api, config: { enabled: true } });

      const tc = dc.tracingChannel("node-redis:command");
      const ctx = {
        command: "GET",
        args: ["GET", "mykey"],
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test-client",
      };

      const error = new Error("READONLY You can't write against a read only replica");
      try {
        await tc.tracePromise(async () => { throw error; }, ctx);
      } catch {}

      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();

      assert.equal(spans.length, 1);
      assert.equal(spans[0].status.code, api.SpanStatusCode.ERROR);
      assert.equal(spans[0].events.length, 1);
      assert.equal(spans[0].events[0].name, "exception");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.errorType], "Error");
    });

    it("should set db.response.status_code for Redis ErrorReply", async () => {
      OTelTracing.init({ api, config: { enabled: true } });

      const tc = dc.tracingChannel("node-redis:command");
      const ctx = {
        command: "SET",
        args: ["SET", "k", "?"],
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };

      // Simulate an ErrorReply (has the class name "ErrorReply")
      const { ErrorReply } = require("../errors");
      const error = new ErrorReply("WRONGTYPE Operation against a key holding the wrong kind of value");
      try {
        await tc.tracePromise(async () => { throw error; }, ctx);
      } catch {}

      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();

      assert.equal(spans.length, 1);
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.errorType], "ErrorReply");
      assert.equal(spans[0].attributes["db.response.status_code"], "WRONGTYPE");
    });

    it("should exclude commands via excludeCommands", async () => {
      OTelTracing.init({
        api,
        config: { enabled: true, excludeCommands: ["PING"] },
      });

      const tc = dc.tracingChannel("node-redis:command");

      // Excluded command
      const pingCtx = {
        command: "PING",
        args: ["PING"],
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };
      await tc.tracePromise(async () => {}, pingCtx);

      // Included command
      const setCtx = {
        command: "SET",
        args: ["SET", "k", "?"],
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };
      await tc.tracePromise(async () => {}, setCtx);

      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();

      assert.equal(spans.length, 1);
      assert.equal(spans[0].name, "SET");
    });

    it("should filter via includeCommands", async () => {
      OTelTracing.init({
        api,
        config: { enabled: true, includeCommands: ["GET"] },
      });

      const tc = dc.tracingChannel("node-redis:command");

      const setCtx = {
        command: "SET",
        args: ["SET", "k", "?"],
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };
      await tc.tracePromise(async () => {}, setCtx);

      const getCtx = {
        command: "GET",
        args: ["GET", "k"],
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };
      await tc.tracePromise(async () => {}, getCtx);

      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();

      assert.equal(spans.length, 1);
      assert.equal(spans[0].name, "GET");
    });
  });

  describe("batch spans", () => {
    it("should create a span for MULTI batch", async () => {
      OTelTracing.init({ api, config: { enabled: true } });

      const tc = dc.tracingChannel("node-redis:batch");
      const ctx = {
        batchMode: "MULTI",
        batchSize: 3,
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };

      await tc.tracePromise(async () => {}, ctx);

      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();

      assert.equal(spans.length, 1);
      assert.equal(spans[0].name, "MULTI");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.dbOperationName], "MULTI");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.dbOperationBatchSize], 3);
    });

    it("should create parent-child relationship for batch > commands", async () => {
      OTelTracing.init({ api, config: { enabled: true } });

      const batchTC = dc.tracingChannel("node-redis:batch");
      const cmdTC = dc.tracingChannel("node-redis:command");

      const batchCtx = {
        batchMode: "MULTI",
        batchSize: 2,
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };

      await batchTC.tracePromise(async () => {
        const cmd1Ctx = {
          command: "SET",
          args: ["SET", "k1", "?"],
          database: 0,
          serverAddress: "localhost",
          serverPort: 6379,
          clientId: "test",
        };
        await cmdTC.tracePromise(async () => {}, cmd1Ctx);

        const cmd2Ctx = {
          command: "SET",
          args: ["SET", "k2", "?"],
          database: 0,
          serverAddress: "localhost",
          serverPort: 6379,
          clientId: "test",
        };
        await cmdTC.tracePromise(async () => {}, cmd2Ctx);
      }, batchCtx);

      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();

      assert.equal(spans.length, 3, "expected 3 spans (1 batch + 2 commands)");

      const batchSpan = spans.find(s => s.name === "MULTI")!;
      const cmdSpans = spans.filter(s => s.name === "SET");

      assert.equal(cmdSpans.length, 2);

      // Command spans should be children of the batch span
      for (const cmd of cmdSpans) {
        assert.equal(
          (cmd as any).parentSpanContext?.spanId,
          batchSpan.spanContext().spanId,
          "command span should be a child of the batch span",
        );
      }
    });
  });

  describe("connection spans", () => {
    it("should not create connection spans by default", async () => {
      OTelTracing.init({ api, config: { enabled: true } });

      const tc = dc.tracingChannel("node-redis:connect");
      const ctx = {
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };

      await tc.tracePromise(async () => {}, ctx);

      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();
      assert.equal(spans.length, 0, "connection spans should be off by default");
    });

    it("should create connection spans when enabled", async () => {
      OTelTracing.init({
        api,
        config: { enabled: true, enableConnectionSpans: true },
      });

      const tc = dc.tracingChannel("node-redis:connect");
      const ctx = {
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };

      await tc.tracePromise(async () => {}, ctx);

      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();
      assert.equal(spans.length, 1);
      assert.equal(spans[0].name, "redis connect");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.serverAddress], "localhost");
      assert.equal(spans[0].attributes[OTEL_ATTRIBUTES.serverPort], 6379);
    });

  });

  describe("lifecycle", () => {
    it("should init only once", () => {
      OTelTracing.init({ api, config: { enabled: true } });
      // Second init should be a no-op (not throw)
      OTelTracing.init({ api, config: { enabled: true } });
      assert.ok(OTelTracing.isInitialized);
    });

    it("should reset cleanly", () => {
      OTelTracing.init({ api, config: { enabled: true } });
      assert.ok(OTelTracing.isInitialized);
      OTelTracing.reset();
      assert.ok(!OTelTracing.isInitialized);
    });

    it("should accept a custom tracerProvider", async () => {
      const customExporter = new InMemorySpanExporter();
      const customProvider = new BasicTracerProvider({
        spanProcessors: [new SimpleSpanProcessor(customExporter)],
      });

      OTelTracing.init({
        api,
        config: { enabled: true, tracerProvider: customProvider },
      });

      const tc = dc.tracingChannel("node-redis:command");
      const ctx = {
        command: "GET",
        args: ["GET", "k"],
        database: 0,
        serverAddress: "localhost",
        serverPort: 6379,
        clientId: "test",
      };
      await tc.tracePromise(async () => {}, ctx);

      await customProvider.forceFlush();
      const spans = customExporter.getFinishedSpans();
      assert.equal(spans.length, 1);
      assert.equal(spans[0].name, "GET");

      await customProvider.shutdown();
    });
  });
});
