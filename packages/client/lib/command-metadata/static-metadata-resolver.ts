import type { PolicyResult, PolicyResolver, ModuleMetadataRecords, CommandMetadataRecords } from './types';
import { COMMAND_METADATA } from './command-metadata-data';
import { CommandIdentifier } from '../client/parser';
import type { CommandMetadata } from './policies-constants';

const lowercaseCommandMetadata = (metadata: CommandMetadata): CommandMetadata => {
  if (!metadata.subcommands) return metadata;
  const subcommands: Record<string, CommandMetadata> = {};
  for (const [name, sub] of Object.entries(metadata.subcommands)) {
    subcommands[name.toLowerCase()] = lowercaseCommandMetadata(sub);
  }
  return { ...metadata, subcommands };
};

const lowercaseModuleMetadata = (metadata: ModuleMetadataRecords): ModuleMetadataRecords => {
  const out: ModuleMetadataRecords = {};
  for (const [moduleName, commands] of Object.entries(metadata)) {
    const normalized: CommandMetadataRecords = {};
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
   * Sets a fallback resolver to use when policies are not found in this resolver.
   *
   * @param fallbackResolver The resolver to fall back to
   * @returns A new StaticMetadataResolver with the specified fallback
   */
  withFallback(fallbackResolver: PolicyResolver): StaticMetadataResolver {
    return new StaticMetadataResolver(this.policies, fallbackResolver);
  }

  /**
   * Convenience over `resolvePolicy` for the resolve-then-fallback readers:
   * returns the resolved metadata or `undefined` on any miss.
   */
  lookup(commandIdentifier: CommandIdentifier): CommandMetadata | undefined {
    const result = this.resolvePolicy(commandIdentifier);
    return result.ok ? result.value : undefined;
  }

  resolvePolicy(commandIdentifier: CommandIdentifier): PolicyResult {
    const parts = commandIdentifier.command.toLowerCase().split('.');

    if (parts.length > 2) {
      return { ok: false, error: 'wrong-command-or-module-name' };
    }

    const [moduleName, commandName] = parts.length === 1
      ? ['std', parts[0]]
      : parts;

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
