import type { PolicyResult, PolicyResolver } from './types';
import { POLICIES } from './static-policies-data';

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

  resolvePolicy(command: string): PolicyResult {
    const parts = command.split('.');

    if (parts.length > 2) {
      return { ok: false, error: 'wrong-command-or-module-name' };
    }

    const [moduleName, commandName] = parts.length === 1
      ? ['std', command]
      : parts;

    if (!this.policies[moduleName]) {
      if (this.fallbackResolver) {
        return this.fallbackResolver.resolvePolicy(command);
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
        return this.fallbackResolver.resolvePolicy(command);
      }
      return { ok: false, error: 'unknown-command' };
    }

    return {
      ok: true,
      value: this.policies[moduleName][commandName]
    }
  }
}
