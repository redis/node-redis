import { parseCommandName, type PolicyResult, type PolicyResolver, type ModuleMetadataRecords, type CommandMetadataRecords } from './types';
import { COMMAND_METADATA } from './command-metadata-data';
import { CommandIdentifier } from '../client/parser';
import type { CommandMetadata } from './policies-constants';

// The rebuilt lookup tables use null-prototype objects: command names come
// off the wire, and a name like "constructor" or "__proto__" must miss the
// table instead of resolving an Object.prototype member as metadata.
const lowercaseCommandMetadata = (metadata: CommandMetadata): CommandMetadata => {
  if (!metadata.subcommands) return metadata;
  const subcommands: Record<string, CommandMetadata> = Object.create(null);
  for (const [name, sub] of Object.entries(metadata.subcommands)) {
    subcommands[name.toLowerCase()] = lowercaseCommandMetadata(sub);
  }
  return { ...metadata, subcommands };
};

const lowercaseModuleMetadata = (metadata: ModuleMetadataRecords): ModuleMetadataRecords => {
  const out: ModuleMetadataRecords = Object.create(null);
  for (const [moduleName, commands] of Object.entries(metadata)) {
    const normalized: CommandMetadataRecords = Object.create(null);
    for (const [commandName, entry] of Object.entries(commands)) {
      normalized[commandName.toLowerCase()] = lowercaseCommandMetadata(entry);
    }
    out[moduleName.toLowerCase()] = normalized;
  }
  return out;
};

export class StaticMetadataResolver implements PolicyResolver {
  private readonly fallbackResolver: PolicyResolver | null = null;
  private readonly policies: ModuleMetadataRecords;

  constructor(
    policies: ModuleMetadataRecords = COMMAND_METADATA,
    fallbackResolver?: PolicyResolver
  ) {
    this.policies = lowercaseModuleMetadata(policies);
    this.fallbackResolver = fallbackResolver || null;
  }

  /**
   * Convenience over `resolvePolicy` for the override-first predicate readers:
   * returns the resolved metadata or `undefined` on any miss.
   */
  lookup(commandIdentifier: CommandIdentifier): CommandMetadata | undefined {
    const result = this.resolvePolicy(commandIdentifier);
    return result.ok ? result.value : undefined;
  }

  resolvePolicy(commandIdentifier: CommandIdentifier): PolicyResult {
    const parsed = parseCommandName(commandIdentifier.command.toLowerCase());

    if (!parsed) {
      return { ok: false, error: 'wrong-command-or-module-name' };
    }

    const { moduleName, commandName } = parsed;

    if (!this.policies[moduleName]) {
      if (this.fallbackResolver) {
        return this.fallbackResolver.resolvePolicy(commandIdentifier);
      }

      // For std module commands, return 'unknown-command' instead of 'unknown-module'
      // to provide better UX for single-word commands
      if (moduleName === 'std') {
        return { ok: false, error: 'unknown-command' };
      }
      return { ok: false, error: 'unknown-module' };
    }

    if (!this.policies[moduleName][commandName]) {
      if (this.fallbackResolver) {
        return this.fallbackResolver.resolvePolicy(commandIdentifier);
      }
      return { ok: false, error: 'unknown-command' };
    }

    const policy = this.policies[moduleName][commandName];

    if (policy.subcommands && commandIdentifier.subcommand !== undefined) {
      const subcommandPolicy = policy.subcommands[commandIdentifier.subcommand.toLowerCase()];
      if (subcommandPolicy) {
        return {
          ok: true,
          value: subcommandPolicy
        };
      }
    }

    return {
      ok: true,
      value: policy
    };
  }
}
