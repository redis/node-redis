import type { PolicyResult, PolicyResolver, ModulePolicyRecords, CommandPolicyRecords } from './types';
import { POLICIES } from './static-policies-data';
import { CommandIdentifier } from '../../client/parser';
import type { CommandPolicies } from './policies-constants';

const lowercaseCommandPolicies = (policies: CommandPolicies): CommandPolicies => {
  if (!policies.subcommands) return policies;
  const subcommands: Record<string, CommandPolicies> = {};
  for (const [name, sub] of Object.entries(policies.subcommands)) {
    subcommands[name.toLowerCase()] = lowercaseCommandPolicies(sub);
  }
  return { ...policies, subcommands };
};

const lowercaseModulePolicies = (policies: ModulePolicyRecords): ModulePolicyRecords => {
  const out: ModulePolicyRecords = {};
  for (const [moduleName, commands] of Object.entries(policies)) {
    const normalized: CommandPolicyRecords = {};
    for (const [commandName, policy] of Object.entries(commands)) {
      normalized[commandName.toLowerCase()] = lowercaseCommandPolicies(policy);
    }
    out[moduleName.toLowerCase()] = normalized;
  }
  return out;
};

export class StaticPolicyResolver implements PolicyResolver {
  private readonly fallbackResolver: PolicyResolver | null = null;
  private readonly policies: ModulePolicyRecords;

  constructor(
    policies: ModulePolicyRecords = POLICIES,
    fallbackResolver?: PolicyResolver
  ) {
    this.policies = lowercaseModulePolicies(policies);
    this.fallbackResolver = fallbackResolver || null;
  }

  /**
   * Sets a fallback resolver to use when policies are not found in this resolver.
   *
   * @param fallbackResolver The resolver to fall back to
   * @returns A new StaticPolicyResolver with the specified fallback
   */
  withFallback(fallbackResolver: PolicyResolver): StaticPolicyResolver {
    return new StaticPolicyResolver(this.policies, fallbackResolver);
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
