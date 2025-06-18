import type { PolicyResult, PolicyResolver } from './types';
import { POLICIES } from './static-policies-data';
import { CommandIdentifier } from '../../client/parser';

export class StaticPolicyResolver implements PolicyResolver {
  private readonly fallbackResolver: PolicyResolver | null = null;

  constructor(
    private readonly policies = POLICIES,
    fallbackResolver?: PolicyResolver
  ) {
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

    console.log(`module name `, moduleName, `command name `, commandName);

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
      // Try fallback resolver if available
      if (this.fallbackResolver) {
        return this.fallbackResolver.resolvePolicy(commandIdentifier);
      }
      return { ok: false, error: 'unknown-command' };
    }

    const policy = this.policies[moduleName][commandName];

    if(policy.subcommands) {
      const subcommandPolicy = policy.subcommands[commandIdentifier.subcommand];
      if(subcommandPolicy) {
        return {
          ok: true,
          value: subcommandPolicy
        }
      }
    }

    return {
      ok: true,
      value: policy
    }
  }
}
