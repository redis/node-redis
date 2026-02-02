import { strict as assert } from "node:assert";
import HYBRID from "./HYBRID";
import { BasicCommandParser } from "@redis/client/lib/client/parser";
import testUtils, { GLOBAL } from "../test-utils";
import { SCHEMA_VECTOR_FIELD_ALGORITHM } from "./CREATE";
import HYBRID_WITHCURSOR from "./HYBRID_WITHCURSOR";

/**
 * Helper function to create a Float32Array vector as a Buffer
 */
const createVectorBuffer = (values: number[]): Buffer => {
  return Buffer.from(new Float32Array(values).buffer);
};

/**
 * Helper function to generate random vector data
 */
const generateRandomVector = (dim: number): number[] => {
  return Array.from({ length: dim }, () => Math.random());
};

/**
 *  Helper function to generate random string data (for vector as string)
 */
const generateRandomStrData = (dim: number): string => {
  const chars = "abcdefgh12345678";
  return Array.from(
    { length: dim },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

/**
 * Items to be added to the index for testing
 */
const FT_HYBRID_ITEMS = [
  { vector: [1, 2, 7, 8], description: "red shoes" },
  { vector: [1, 4, 7, 8], description: "green shoes with red laces" },
  { vector: [1, 2, 6, 5], description: "red dress" },
  { vector: [2, 3, 6, 5], description: "orange dress" },
  { vector: [5, 6, 7, 8], description: "black shoes" },
];

/**
 * Helper to create the index for hybrid search tests
 */
const createHybridSearchIndex = async (
  client: any,
  indexName: string,
  dim = 4,
) => {
  await client.ft.create(
    indexName,
    {
      description: { type: "TEXT" },
      price: { type: "NUMERIC" },
      color: { type: "TAG" },
      itemType: { type: "TAG" },
      size: { type: "NUMERIC" },
      embedding: {
        type: "VECTOR",
        ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.FLAT,
        TYPE: "FLOAT32",
        DIM: dim,
        DISTANCE_METRIC: "L2",
      },
      embeddingHNSW: {
        type: "VECTOR",
        ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.HNSW,
        TYPE: "FLOAT32",
        DIM: dim,
        DISTANCE_METRIC: "L2",
      },
    },
    {
      ON: "HASH",
      PREFIX: "item:",
    },
  );
};

/**
 * Helper to add data to the index for hybrid search tests
 */
const addDataForHybridSearch = async (
  client: any,
  itemsSets = 1,
  options: {
    randomizeData?: boolean;
    dimForRandomData?: number;
    useRandomStrData?: boolean;
  } = {},
) => {
  const {
    randomizeData = false,
    dimForRandomData = 4,
    useRandomStrData = false,
  } = options;

  let items: Array<{ vector: number[] | string; description: string }>;

  if (randomizeData || useRandomStrData) {
    const actualDim = useRandomStrData
      ? dimForRandomData * 4
      : dimForRandomData;
    const generateDataFunc = useRandomStrData
      ? () => generateRandomStrData(actualDim)
      : () => generateRandomVector(actualDim);

    items = [
      { vector: generateDataFunc() as any, description: "red shoes" },
      {
        vector: generateDataFunc() as any,
        description: "green shoes with red laces",
      },
      { vector: generateDataFunc() as any, description: "red dress" },
      { vector: generateDataFunc() as any, description: "orange dress" },
      { vector: generateDataFunc() as any, description: "black shoes" },
    ];
  } else {
    items = FT_HYBRID_ITEMS;
  }

  // Multiply items by itemsSets
  const allItems: typeof items = [];
  for (let s = 0; s < itemsSets; s++) {
    allItems.push(...items);
  }

  const promises: Promise<any>[] = [];
  for (let i = 0; i < allItems.length; i++) {
    const { vector, description } = allItems[i];
    const embeddingData =
      typeof vector === "string"
        ? vector
        : createVectorBuffer(vector as number[]);

    promises.push(
      client.hSet(`item:${i}`, {
        description,
        embedding: embeddingData,
        embeddingHNSW: embeddingData,
        price: String(15 + (i % 4)),
        color: description.split(" ")[0],
        itemType: description.split(" ")[1],
        size: String(10 + (i % 3)),
      }),
    );
  }
  await Promise.all(promises);
};

describe("FT.HYBRID", () => {
  describe("transformArguments", () => {
    it("minimal command", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index");
      assert.deepEqual(parser.redisArgs, ["FT.HYBRID", "index"]);
    });

    it("with SEARCH expression", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        SEARCH: {
          query: "@description: bikes",
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "SEARCH",
        "@description: bikes",
      ]);
    });

    it("with SEARCH expression and SCORER", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        SEARCH: {
          query: "@description: bikes",
          SCORER: {
            algorithm: "TFIDF.DOCNORM",
            params: ["param1", "param2"],
          },
          YIELD_SCORE_AS: "search_score",
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "SEARCH",
        "@description: bikes",
        "SCORER",
        "TFIDF.DOCNORM",
        "param1",
        "param2",
        "YIELD_SCORE_AS",
        "search_score",
      ]);
    });

    it("with VSIM expression and KNN method", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        VSIM: {
          field: "@vector_field",
          vectorData: "BLOB_DATA",
          method: {
            KNN: {
              K: 10,
              EF_RUNTIME: 50,
              YIELD_DISTANCE_AS: "vector_dist",
            },
          },
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "VSIM",
        "@vector_field",
        "$v",
        "KNN",
        "6",
        "K",
        "10",
        "EF_RUNTIME",
        "50",
        "YIELD_DISTANCE_AS",
        "vector_dist",
        "PARAMS",
        "2",
        "v",
        "BLOB_DATA",
      ]);
    });

    it("with VSIM expression and RANGE method", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        VSIM: {
          field: "@vector_field",
          vectorData: "BLOB_DATA",
          method: {
            RANGE: {
              RADIUS: 0.5,
              EPSILON: 0.01,
              YIELD_DISTANCE_AS: "vector_dist",
            },
          },
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "VSIM",
        "@vector_field",
        "$v",
        "RANGE",
        "6",
        "RADIUS",
        "0.5",
        "EPSILON",
        "0.01",
        "YIELD_DISTANCE_AS",
        "vector_dist",
        "PARAMS",
        "2",
        "v",
        "BLOB_DATA",
      ]);
    });

    it("with VSIM expression and FILTER", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        VSIM: {
          field: "@vector_field",
          vectorData: "BLOB_DATA",
          FILTER: "@category:{bikes}",
          YIELD_SCORE_AS: "vsim_score",
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "VSIM",
        "@vector_field",
        "$v",
        "FILTER",
        "@category:{bikes}",
        "YIELD_SCORE_AS",
        "vsim_score",
        "PARAMS",
        "2",
        "v",
        "BLOB_DATA",
      ]);
    });

    it("with RRF COMBINE method", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        COMBINE: {
          method: {
            RRF: {
              WINDOW: 10,
              CONSTANT: 60,
            },
          },
          YIELD_SCORE_AS: "combined_score",
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "COMBINE",
        "RRF",
        "6",
        "WINDOW",
        "10",
        "CONSTANT",
        "60",
        "YIELD_SCORE_AS",
        "combined_score",
      ]);
    });

    it("with LINEAR COMBINE method", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        COMBINE: {
          method: {
            LINEAR: {
              ALPHA: 0.7,
              BETA: 0.3,
            },
          },
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "COMBINE",
        "LINEAR",
        "4",
        "ALPHA",
        "0.7",
        "BETA",
        "0.3",
      ]);
    });

    it("with LOAD, SORTBY, and LIMIT", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        LOAD: ["field1", "field2"],
        SORTBY: {
          fields: [{ field: "score", direction: "DESC" }],
        },
        LIMIT: {
          offset: 0,
          count: 10,
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "LOAD",
        "2",
        "field1",
        "field2",
        "SORTBY",
        "2",
        "score",
        "DESC",
        "LIMIT",
        "0",
        "10",
      ]);
    });

    it("with GROUPBY and REDUCE", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        GROUPBY: {
          fields: ["@category"],
          REDUCE: {
            function: "COUNT",
            nargs: 0,
            args: [],
          },
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "GROUPBY",
        "1",
        "@category",
        "REDUCE",
        "COUNT",
        "0",
      ]);
    });

    it("with APPLY", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        APPLY: {
          expression: "@score * 2",
          AS: "double_score",
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "APPLY",
        "@score * 2",
        "AS",
        "double_score",
      ]);
    });

    it("with FILTER and post-processing", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        FILTER: "@price:[100 500]",
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "FILTER",
        "@price:[100 500]",
      ]);
    });

    it("with PARAMS", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        PARAMS: {
          query_vector: "BLOB_DATA",
          min_price: 100,
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "PARAMS",
        "4",
        "query_vector",
        "BLOB_DATA",
        "min_price",
        "100",
      ]);
    });

    it("with TIMEOUT", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        TIMEOUT: 5000,
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "TIMEOUT",
        "5000",
      ]);
    });

    it("with SEARCH YIELD_SCORE_AS", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        SEARCH: {
          query: "shoes",
          YIELD_SCORE_AS: "search_score",
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "SEARCH",
        "shoes",
        "YIELD_SCORE_AS",
        "search_score",
      ]);
    });

    it("with VSIM YIELD_SCORE_AS", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        VSIM: {
          field: "@embedding",
          vectorData: "BLOB_DATA",
          YIELD_SCORE_AS: "vsim_score",
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "VSIM",
        "@embedding",
        "$v",
        "YIELD_SCORE_AS",
        "vsim_score",
        "PARAMS",
        "2",
        "v",
        "BLOB_DATA",
      ]);
    });

    it("with multiple APPLY expressions", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        APPLY: [
          { expression: "@price - (@price * 0.1)", AS: "price_discount" },
          { expression: "@price_discount * 0.2", AS: "tax_discount" },
        ],
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "APPLY",
        "@price - (@price * 0.1)",
        "AS",
        "price_discount",
        "APPLY",
        "@price_discount * 0.2",
        "AS",
        "tax_discount",
      ]);
    });

    it("with GROUPBY and multiple REDUCE functions", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        GROUPBY: {
          fields: ["@itemType", "@price"],
          REDUCE: [
            {
              function: "COUNT_DISTINCT",
              nargs: 1,
              args: ["@color"],
              AS: "colors_count",
            },
            {
              function: "MIN",
              nargs: 1,
              args: ["@size"],
            },
          ],
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "GROUPBY",
        "2",
        "@itemType",
        "@price",
        "REDUCE",
        "COUNT_DISTINCT",
        "1",
        "@color",
        "AS",
        "colors_count",
        "REDUCE",
        "MIN",
        "1",
        "@size",
      ]);
    });

    it("with multiple SORTBY fields", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        SORTBY: {
          fields: [
            { field: "@price_discount", direction: "DESC" },
            { field: "@color", direction: "ASC" },
          ],
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "SORTBY",
        "4",
        "@price_discount",
        "DESC",
        "@color",
        "ASC",
      ]);
    });

    it("complete example with all options", () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, "index", {
        SEARCH: {
          query: "@description: bikes",
          SCORER: {
            algorithm: "TFIDF.DOCNORM",
          },
          YIELD_SCORE_AS: "text_score",
        },
        VSIM: {
          field: "@vector_field",
          vectorData: "$query_vector",
          method: {
            KNN: {
              K: 5,
            },
          },
          YIELD_SCORE_AS: "vector_score",
        },
        COMBINE: {
          method: {
            RRF: {
              CONSTANT: 60,
            },
          },
          YIELD_SCORE_AS: "final_score",
        },
        LOAD: ["description", "price"],
        SORTBY: {
          fields: [{ field: "final_score", direction: "DESC" }],
        },
        LIMIT: {
          offset: 0,
          count: 10,
        },
        PARAMS: {
          query_vector: "BLOB_DATA",
        },
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "SEARCH",
        "@description: bikes",
        "SCORER",
        "TFIDF.DOCNORM",
        "YIELD_SCORE_AS",
        "text_score",
        "VSIM",
        "@vector_field",
        "$query_vector",
        "KNN",
        "2",
        "K",
        "5",
        "YIELD_SCORE_AS",
        "vector_score",
        "COMBINE",
        "RRF",
        "4",
        "CONSTANT",
        "60",
        "YIELD_SCORE_AS",
        "final_score",
        "LOAD",
        "2",
        "description",
        "price",
        "SORTBY",
        "2",
        "final_score",
        "DESC",
        "LIMIT",
        "0",
        "10",
        "PARAMS",
        "2",
        "query_vector",
        "BLOB_DATA",
      ]);
    });
  });

  describe("client.ft.create", () => {
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "basic hybrid search",
      async (client) => {
        const indexName = "idx_basic_hybrid";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 5);

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red} @color:{green}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([-100, -200, -200, -300]),
          },
        });

        // Default results count limit is 10
        assert.strictEqual(result.totalResults, 10);
        assert.strictEqual(result.results.length, 10);
        assert.deepStrictEqual(result.warnings, []);
        assert.ok(result.executionTime > 0);
      },
      GLOBAL.SERVERS.OPEN,
    );

    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with scorer",
      async (client) => {
        const indexName = "idx_scorer";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        // Test with TFIDF scorer
        const resultTfidf = await client.ft.hybrid(indexName, {
          SEARCH: {
            query: "shoes",
            SCORER: { algorithm: "TFIDF" },
          },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 2, 3]),
          },
          COMBINE: {
            method: { LINEAR: { ALPHA: 1, BETA: 0 } },
          },
          LOAD: [
            "@description",
            "@color",
            "@price",
            "@size",
            "@__score",
            "@__item",
          ],
          LIMIT: { offset: 0, count: 2 },
        });

        assert.ok(resultTfidf.totalResults >= 2);
        assert.strictEqual(resultTfidf.results.length, 2);
        assert.deepStrictEqual(resultTfidf.warnings, []);

        // Test with BM25 scorer
        const resultBm25 = await client.ft.hybrid(indexName, {
          SEARCH: {
            query: "shoes",
            SCORER: { algorithm: "BM25" },
          },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 2, 3]),
          },
          COMBINE: {
            method: { LINEAR: { ALPHA: 1, BETA: 0 } },
          },
          LOAD: [
            "@description",
            "@color",
            "@price",
            "@size",
            "@__score",
            "@__item",
          ],
          LIMIT: { offset: 0, count: 2 },
        });

        assert.ok(resultBm25.totalResults >= 2);
        assert.strictEqual(resultBm25.results.length, 2);
        assert.deepStrictEqual(resultBm25.warnings, []);
      },
      GLOBAL.SERVERS.OPEN,
    );

    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with vsim method defined in query init",
      async (client) => {
        const indexName = "idx_vsim_method";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 5, { useRandomStrData: true });

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "shoes" },
          VSIM: {
            field: "@embeddingHNSW",
            vectorData: "abcd1234efgh5678",
            method: {
              KNN: { K: 3, EF_RUNTIME: 1 },
            },
          },
          TIMEOUT: 10000,
        });

        assert.ok(result.results.length > 0);
        assert.deepStrictEqual(result.warnings, []);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with VSIM filter
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with vsim filter",
      async (client) => {
        const indexName = "idx_vsim_filter";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 5, { useRandomStrData: true });

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{missing}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 2, 3]),
            FILTER: "@price:[15 16] @size:[10 11]",
          },
          LOAD: ["@price", "@size"],
          TIMEOUT: 10000,
        });

        assert.ok(result.results.length > 0);
        assert.deepStrictEqual(result.warnings, []);

        for (const item of result.results) {
          assert.ok(["15", "16"].includes(item.price));
          assert.ok(["10", "11"].includes(item.size));
        }
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with search score aliases
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with search score aliases",
      async (client) => {
        const indexName = "idx_search_score_alias";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 1, { useRandomStrData: true });

        const result = await client.ft.hybrid(indexName, {
          SEARCH: {
            query: "shoes",
            YIELD_SCORE_AS: "search_score",
          },
          VSIM: {
            field: "@embedding",
            vectorData: "abcd1234efgh5678",
          },
          TIMEOUT: 10000,
        });

        assert.ok(result.results.length > 0);
        assert.deepStrictEqual(result.warnings, []);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with VSIM score aliases
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with vsim score aliases",
      async (client) => {
        const indexName = "idx_vsim_score_alias";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 1, { useRandomStrData: true });

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "shoes" },
          VSIM: {
            field: "@embeddingHNSW",
            vectorData: "abcd1234efgh5678",
            method: {
              KNN: { K: 3, EF_RUNTIME: 1 },
            },
            YIELD_SCORE_AS: "vsim_score",
          },
          TIMEOUT: 10000,
        });

        assert.ok(result.results.length > 0);
        assert.deepStrictEqual(result.warnings, []);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with combine score aliases
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with combine score aliases",
      async (client) => {
        const indexName = "idx_combine_score_alias";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 1, { useRandomStrData: true });

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "shoes" },
          VSIM: {
            field: "@embeddingHNSW",
            vectorData: "abcd1234efgh5678",
          },
          COMBINE: {
            method: { LINEAR: { ALPHA: 0.5, BETA: 0.5 } },
            YIELD_SCORE_AS: "combined_score",
          },
          TIMEOUT: 10000,
        });

        assert.ok(result.results.length > 0);
        assert.deepStrictEqual(result.warnings, []);

        for (const item of result.results) {
          assert.ok(item.combined_score !== undefined);
        }
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with all score aliases
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with all score aliases",
      async (client) => {
        const indexName = "idx_all_score_alias";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 1, { useRandomStrData: true });

        const result = await client.ft.hybrid(indexName, {
          SEARCH: {
            query: "shoes",
            YIELD_SCORE_AS: "search_score",
          },
          VSIM: {
            field: "@embeddingHNSW",
            vectorData: "abcd1234efgh5678",
            method: {
              KNN: { K: 3, EF_RUNTIME: 1 },
            },
            YIELD_SCORE_AS: "vsim_score",
          },
          COMBINE: {
            method: { LINEAR: { ALPHA: 0.5, BETA: 0.5 } },
            YIELD_SCORE_AS: "combined_score",
          },
          TIMEOUT: 10000,
        });

        assert.ok(result.results.length > 0);
        assert.deepStrictEqual(result.warnings, []);

        for (const item of result.results) {
          assert.ok(item.combined_score !== undefined);
        }
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with VSIM KNN
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with vsim knn",
      async (client) => {
        const indexName = "idx_vsim_knn";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        // Query that won't have results to validate VSIM results
        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{none}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 2, 3]),
            method: {
              KNN: { K: 3 },
            },
          },
          TIMEOUT: 10000,
        });

        assert.strictEqual(result.totalResults, 3); // KNN top-k value
        assert.strictEqual(result.results.length, 3);
        assert.deepStrictEqual(result.warnings, []);
        assert.ok(result.executionTime > 0);

        // Test with HNSW vector field
        const result2 = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{none}" },
          VSIM: {
            field: "@embeddingHNSW",
            vectorData: createVectorBuffer([1, 2, 2, 3]),
            method: {
              KNN: { K: 3, EF_RUNTIME: 1 },
            },
          },
          TIMEOUT: 10000,
        });

        assert.strictEqual(result2.totalResults, 3);
        assert.strictEqual(result2.results.length, 3);
        assert.deepStrictEqual(result2.warnings, []);
        assert.ok(result2.executionTime > 0);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with VSIM RANGE
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with vsim range",
      async (client) => {
        const indexName = "idx_vsim_range";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        // Query that won't have results to validate VSIM results
        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{none}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
            method: {
              RANGE: { RADIUS: 2 },
            },
          },
          LIMIT: { offset: 0, count: 3 },
          TIMEOUT: 10000,
        });

        assert.ok(result.totalResults >= 3);
        assert.strictEqual(result.results.length, 3);
        assert.deepStrictEqual(result.warnings, []);
        assert.ok(result.executionTime > 0);

        // Test with HNSW and EPSILON
        const result2 = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{none}" },
          VSIM: {
            field: "@embeddingHNSW",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
            method: {
              RANGE: { RADIUS: 2, EPSILON: 0.5 },
            },
          },
          LIMIT: { offset: 0, count: 3 },
          TIMEOUT: 10000,
        });

        assert.ok(result2.totalResults >= 3);
        assert.strictEqual(result2.results.length, 3);
        assert.deepStrictEqual(result2.warnings, []);
        assert.ok(result2.executionTime > 0);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with combine methods (LINEAR and RRF)
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with combine methods",
      async (client) => {
        const indexName = "idx_combine";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        // Test with LINEAR combine method
        const resultLinear = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          COMBINE: {
            method: { LINEAR: { ALPHA: 0.5, BETA: 0.5 } },
          },
          LIMIT: { offset: 0, count: 3 },
          TIMEOUT: 10000,
        });

        assert.ok(resultLinear.totalResults >= 3);
        assert.strictEqual(resultLinear.results.length, 3);
        assert.deepStrictEqual(resultLinear.warnings, []);
        assert.ok(resultLinear.executionTime > 0);

        // Test with RRF combine method with WINDOW and CONSTANT
        const resultRrf = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          COMBINE: {
            method: { RRF: { WINDOW: 3, CONSTANT: 0.5 } },
          },
          LIMIT: { offset: 0, count: 3 },
          TIMEOUT: 10000,
        });

        assert.ok(resultRrf.totalResults >= 3);
        assert.strictEqual(resultRrf.results.length, 3);
        assert.deepStrictEqual(resultRrf.warnings, []);
        assert.ok(resultRrf.executionTime > 0);

        // Test with RRF without all params
        const resultRrf2 = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          COMBINE: {
            method: { RRF: { WINDOW: 3 } },
          },
          LIMIT: { offset: 0, count: 3 },
          TIMEOUT: 10000,
        });

        assert.ok(resultRrf2.totalResults >= 3);
        assert.strictEqual(resultRrf2.results.length, 3);
        assert.deepStrictEqual(resultRrf2.warnings, []);
        assert.ok(resultRrf2.executionTime > 0);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with LOAD
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with load",
      async (client) => {
        const indexName = "idx_load";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red|green|black}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          COMBINE: {
            method: { LINEAR: { ALPHA: 0.5, BETA: 0.5 } },
          },
          LOAD: [
            "@description",
            "@color",
            "@price",
            "@size",
            "@__key AS item_key",
          ],
          LIMIT: { offset: 0, count: 1 },
          TIMEOUT: 10000,
        });

        assert.ok(result.totalResults >= 1);
        assert.strictEqual(result.results.length, 1);
        assert.deepStrictEqual(result.warnings, []);
        assert.ok(result.executionTime > 0);

        // Check that loaded fields exist
        const doc = result.results[0];
        assert.ok(doc.description !== undefined);
        assert.ok(doc.color !== undefined);
        assert.ok(doc.price !== undefined);
        assert.ok(doc.size !== undefined);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with LOAD and APPLY
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with load and apply",
      async (client) => {
        const indexName = "idx_load_apply";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          LOAD: ["@color", "@price", "@size"],
          APPLY: [
            { expression: "@price - (@price * 0.1)", AS: "price_discount" },
            { expression: "@price_discount * 0.2", AS: "tax_discount" },
          ],
          LIMIT: { offset: 0, count: 3 },
          TIMEOUT: 10000,
        });

        assert.strictEqual(result.results.length, 3);
        assert.deepStrictEqual(result.warnings, []);
        assert.ok(result.executionTime > 0);

        // Check that applied fields exist
        for (const doc of result.results) {
          assert.ok(doc.color !== undefined);
          assert.ok(doc.price !== undefined);
          assert.ok(doc.size !== undefined);
          assert.ok(doc.price_discount !== undefined);
          assert.ok(doc.tax_discount !== undefined);
        }
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with LOAD and FILTER
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with load and filter",
      async (client) => {
        const indexName = "idx_load_filter";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red|green|black}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          LOAD: ["@description", "@color", "@price", "@size"],
          FILTER: '@price=="15"',
          LIMIT: { offset: 0, count: 3 },
          TIMEOUT: 10000,
        });

        assert.strictEqual(result.results.length, 3);
        assert.deepStrictEqual(result.warnings, []);
        assert.ok(result.executionTime > 0);

        for (const item of result.results) {
          assert.strictEqual(item.price, "15");
        }
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with LOAD, APPLY, and PARAMS
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with load apply and params",
      async (client) => {
        const indexName = "idx_load_apply_params";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 5, { useRandomStrData: true });

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{$color_criteria}" },
          VSIM: {
            field: "@embedding",
            vectorData: "$vector",
          },
          LOAD: ["@description", "@color", "@price"],
          APPLY: [
            { expression: "@price - (@price * 0.1)", AS: "price_discount" },
          ],
          LIMIT: { offset: 0, count: 3 },
          PARAMS: {
            vector: "abcd1234abcd5678",
            color_criteria: "red",
          },
          TIMEOUT: 10000,
        });

        assert.strictEqual(result.results.length, 3);
        assert.deepStrictEqual(result.warnings, []);
        assert.ok(result.executionTime > 0);

        for (const doc of result.results) {
          assert.ok(doc.description !== undefined);
          assert.ok(doc.color !== undefined);
          assert.ok(doc.price !== undefined);
          assert.ok(doc.price_discount !== undefined);
        }
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with LIMIT
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with limit",
      async (client) => {
        const indexName = "idx_limit";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          LIMIT: { offset: 0, count: 3 },
          TIMEOUT: 10000,
        });

        assert.strictEqual(result.results.length, 3);
        assert.deepStrictEqual(result.warnings, []);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with LOAD, APPLY, and SORTBY
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with load apply and sortby",
      async (client) => {
        const indexName = "idx_sortby";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 1);

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red|green}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          LOAD: ["@color", "@price"],
          APPLY: [
            { expression: "@price - (@price * 0.1)", AS: "price_discount" },
          ],
          SORTBY: {
            fields: [
              { field: "@price_discount", direction: "DESC" },
              { field: "@color", direction: "ASC" },
            ],
          },
          LIMIT: { offset: 0, count: 5 },
          TIMEOUT: 10000,
        });

        assert.ok(result.totalResults >= 5);
        assert.strictEqual(result.results.length, 5);
        assert.deepStrictEqual(result.warnings, []);
        assert.ok(result.executionTime > 0);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with timeout
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with timeout",
      async (client) => {
        const dim = 128;
        const indexName = "idx_timeout";
        await createHybridSearchIndex(client, indexName, dim);
        await addDataForHybridSearch(client, 1000, {
          dimForRandomData: dim,
          useRandomStrData: true,
        });

        // Normal timeout should succeed
        const timeout = 5000; // 5 second timeout
        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "*" },
          VSIM: {
            field: "@embeddingHNSW",
            vectorData: "abcd".repeat(dim),
            method: {
              KNN: { K: 1000 },
            },
            FILTER:
              "((@price:[15 16] @size:[10 11]) | (@price:[13 15] @size:[11 12])) @description:(shoes) -@description:(green)",
          },
          COMBINE: {
            method: { RRF: { WINDOW: 1000 } },
          },
          TIMEOUT: timeout,
        });

        assert.ok(result.results.length > 0);
        assert.deepStrictEqual(result.warnings, []);
        assert.ok(result.executionTime > 0 && result.executionTime < timeout);

        // Very short timeout may cause warnings
        const result2 = await client.ft.hybrid(indexName, {
          SEARCH: { query: "*" },
          VSIM: {
            field: "@embeddingHNSW",
            vectorData: "abcd".repeat(dim),
            method: {
              KNN: { K: 1000 },
            },
          },
          TIMEOUT: 1, // 1ms timeout - likely to timeout
        });

        // May have timeout warnings
        // Note: This is timing-dependent, so we just check it returns
        assert.ok(result2 !== undefined);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with LOAD and GROUPBY
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with load and groupby",
      async (client) => {
        const indexName = "idx_groupby";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red|green}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          LOAD: ["@color", "@price", "@size", "@itemType"],
          GROUPBY: {
            fields: ["@itemType", "@price"],
            REDUCE: [
              {
                function: "COUNT_DISTINCT",
                nargs: 1,
                args: ["@color"],
                AS: "colors_count",
              },
              {
                function: "MIN",
                nargs: 1,
                args: ["@size"],
              },
            ],
          },
          SORTBY: {
            fields: [{ field: "@price", direction: "ASC" }],
          },
          LIMIT: { offset: 0, count: 4 },
          TIMEOUT: 10000,
        });

        assert.strictEqual(result.results.length, 4);
        assert.deepStrictEqual(result.warnings, []);
      },
      GLOBAL.SERVERS.OPEN,
    );

    // Test: Hybrid search with multiple LOADs and APPLYs
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with multiple loads and applies",
      async (client) => {
        const indexName = "idx_multi_load_apply";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 1);

        const result = await client.ft.hybrid(indexName, {
          SEARCH: { query: "@color:{red|green}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          LOAD: ["@color", "@price", "@description"],
          APPLY: [
            {
              expression: "@price - (@price * 0.1)",
              AS: "discount_10_percents",
            },
            {
              expression:
                "@discount_10_percents - (@discount_10_percents * 0.1)",
              AS: "additional_discount",
            },
          ],
          FILTER: '@price=="15"',
          SORTBY: {
            fields: [
              { field: "@discount_10_percents", direction: "DESC" },
              { field: "@color", direction: "ASC" },
            ],
          },
          LIMIT: { offset: 0, count: 5 },
          TIMEOUT: 10000,
        });

        assert.strictEqual(result.results.length, 2);
        for (const item of result.results) {
          assert.ok(item.color !== undefined);
          assert.ok(item.price !== undefined);
          assert.ok(item.description !== undefined);
          assert.ok(item.discount_10_percents !== undefined);
          assert.ok(item.additional_discount !== undefined);
        }
      },
      GLOBAL.SERVERS.OPEN,
    );
  });
});


describe("FT.HYBRID_WITHCURSOR", () => {
  describe("transformArguments", () => {
    it("minimal command with WITHCURSOR", () => {
      const parser = new BasicCommandParser();
      HYBRID_WITHCURSOR.parseCommand(parser, "index");
      assert.deepEqual(parser.redisArgs, ["FT.HYBRID", "index", "WITHCURSOR"]);
    });

    it("with COUNT", () => {
      const parser = new BasicCommandParser();
      HYBRID_WITHCURSOR.parseCommand(parser, "index", {
        COUNT: 10,
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "WITHCURSOR",
        "COUNT",
        "10",
      ]);
    });

    it("with MAXIDLE", () => {
      const parser = new BasicCommandParser();
      HYBRID_WITHCURSOR.parseCommand(parser, "index", {
        MAXIDLE: 5000,
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "WITHCURSOR",
        "MAXIDLE",
        "5000",
      ]);
    });

    it("with COUNT and MAXIDLE", () => {
      const parser = new BasicCommandParser();
      HYBRID_WITHCURSOR.parseCommand(parser, "index", {
        COUNT: 10,
        MAXIDLE: 5000,
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "WITHCURSOR",
        "COUNT",
        "10",
        "MAXIDLE",
        "5000",
      ]);
    });

    it("with SEARCH and VSIM options plus cursor options", () => {
      const parser = new BasicCommandParser();
      HYBRID_WITHCURSOR.parseCommand(parser, "index", {
        SEARCH: {
          query: "@description: bikes",
        },
        VSIM: {
          field: "@vector_field",
          vectorData: "BLOB_DATA",
        },
        COUNT: 5,
        MAXIDLE: 1000,
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "SEARCH",
        "@description: bikes",
        "VSIM",
        "@vector_field",
        "$v",
        "PARAMS",
        "2",
        "v",
        "BLOB_DATA",
        "WITHCURSOR",
        "COUNT",
        "5",
        "MAXIDLE",
        "1000",
      ]);
    });

    it("with LIMIT and cursor options", () => {
      const parser = new BasicCommandParser();
      HYBRID_WITHCURSOR.parseCommand(parser, "index", {
        SEARCH: { query: "shoes" },
        LIMIT: { offset: 0, count: 10 },
        COUNT: 5,
      });
      assert.deepEqual(parser.redisArgs, [
        "FT.HYBRID",
        "index",
        "SEARCH",
        "shoes",
        "LIMIT",
        "0",
        "10",
        "WITHCURSOR",
        "COUNT",
        "5",
      ]);
    });
  });

  describe("client.ft.hybridWithCursor", () => {
    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "basic hybrid search with cursor",
      async (client) => {
        const indexName = "idx_cursor_basic";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        const result = await client.ft.hybridWithCursor(indexName, {
          SEARCH: { query: "@color:{red|green}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          COUNT: 5,
          TIMEOUT: 10000,
        });
        assert.ok(result !== undefined);
        assert.ok(!Number.isNaN(result.searchCursor));
        assert.ok(!Number.isNaN(result.vsimCursor));
        assert.ok(typeof result.searchCursor === "number");
        assert.ok(typeof result.vsimCursor === "number");
        assert.ok(Array.isArray(result.warnings));
      },
      GLOBAL.SERVERS.OPEN,
    );

    // NOTE: FT.HYBRID requires both SEARCH and VSIM subqueries.
    // Using only SEARCH or only VSIM results in Redis errors:
    // - SEARCH only: "Unknown argument `TIMEOUT` in SEARCH"
    // - VSIM only: "Invalid subqueries count: expected an unsigned integer"

    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with cursor and MAXIDLE",
      async (client) => {
        const indexName = "idx_cursor_maxidle";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        const result = await client.ft.hybridWithCursor(indexName, {
          SEARCH: { query: "@color:{red|green}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          COUNT: 5,
          MAXIDLE: 10000,
          TIMEOUT: 10000,
        });

        assert.ok(result !== undefined);
        assert.ok(!Number.isNaN(result.searchCursor));
        assert.ok(!Number.isNaN(result.vsimCursor));
        assert.ok(typeof result.searchCursor === "number");
        assert.ok(typeof result.vsimCursor === "number");
      },
      GLOBAL.SERVERS.OPEN,
    );

    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with cursor iteration",
      async (client) => {
        const indexName = "idx_cursor_iterate";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 20);

        // First request with cursor
        const result1 = await client.ft.hybridWithCursor(indexName, {
          SEARCH: { query: "@color:{red|green|black|orange}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          COUNT: 10,
          MAXIDLE: 30000,
          TIMEOUT: 10000,
        });

        assert.ok(result1 !== undefined);
        assert.ok(!Number.isNaN(result1.searchCursor));
        assert.ok(!Number.isNaN(result1.vsimCursor));
        assert.ok(typeof result1.searchCursor === "number");
        assert.ok(typeof result1.vsimCursor === "number");

        // NOTE: HYBRID cursors work differently from AGGREGATE cursors.
        // They have separate cursor IDs for SEARCH and VSIM components.
        // Further cursor reading would need a different mechanism.
      },
      GLOBAL.SERVERS.OPEN,
    );

    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with cursor and LOAD",
      async (client) => {
        const indexName = "idx_cursor_load";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        const result = await client.ft.hybridWithCursor(indexName, {
          SEARCH: { query: "@color:{red|green}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          LOAD: ["@description", "@color", "@price"],
          COUNT: 3,
          TIMEOUT: 10000,
        });

        assert.ok(result !== undefined);
        assert.ok(!Number.isNaN(result.searchCursor));
        assert.ok(!Number.isNaN(result.vsimCursor));
        assert.ok(Array.isArray(result.warnings));
      },
      GLOBAL.SERVERS.OPEN,
    );

    testUtils.testWithClientIfVersionWithinRange(
      [[8, 6], "LATEST"],
      "hybrid search with cursor and COMBINE",
      async (client) => {
        const indexName = "idx_cursor_combine";
        await createHybridSearchIndex(client, indexName);
        await addDataForHybridSearch(client, 10);

        const result = await client.ft.hybridWithCursor(indexName, {
          SEARCH: { query: "@color:{red}" },
          VSIM: {
            field: "@embedding",
            vectorData: createVectorBuffer([1, 2, 7, 6]),
          },
          COMBINE: {
            method: { LINEAR: { ALPHA: 0.5, BETA: 0.5 } },
            YIELD_SCORE_AS: "combined_score",
          },
          COUNT: 5,
          TIMEOUT: 10000,
        });

        assert.ok(result !== undefined);
        assert.ok(!Number.isNaN(result.searchCursor));
        assert.ok(!Number.isNaN(result.vsimCursor));
        assert.ok(typeof result.searchCursor === "number");
        assert.ok(typeof result.vsimCursor === "number");
        assert.deepStrictEqual(result.warnings, []);
      },
      GLOBAL.SERVERS.OPEN,
    );
  });
});
