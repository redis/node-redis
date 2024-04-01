import { createHash } from "crypto";
import { ValkeyCommand } from "./commands";

export interface ValkeyScriptConfig extends ValkeyCommand {
  SCRIPT: string;
  NUMBER_OF_KEYS?: number;
}

export interface SHA1 {
  SHA1: string;
}

export function defineScript<S extends ValkeyScriptConfig>(
  script: S
): S & SHA1 {
  return {
    ...script,
    SHA1: scriptSha1(script.SCRIPT),
  };
}

export function scriptSha1(script: string): string {
  return createHash("sha1").update(script).digest("hex");
}
