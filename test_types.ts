import { createClient } from "redis";

// This should work without type checking hanging
const client = createClient();

export { client };
