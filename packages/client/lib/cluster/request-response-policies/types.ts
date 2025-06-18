import { CommandIdentifier } from '../../client/parser';
import type { CommandPolicies } from './policies-constants';

export type Either<TOk, TError> =
  | { readonly ok: true; readonly value: TOk }
  | { readonly ok: false; readonly error: TError };

export type PolicyResult = Either<CommandPolicies, 'policy-not-found' | 'unknown-command' | 'unknown-module' | 'wrong-command-or-module-name' | 'no-policy-resolved'>;


export interface PolicyResolver {
  /**
   * The response of the COMMAND command uses "." to separate the module name from the command name.
   */
  resolvePolicy(commandIdentifier: CommandIdentifier): PolicyResult;

  /**
   * Sets a fallback resolver to use when policies are not found in this resolver.
   *
   * @param fallbackResolver The resolver to fall back to
   * @returns A new PolicyResolver with the specified fallback
   */
  withFallback(fallbackResolver: PolicyResolver): PolicyResolver;
}

export type CommandPolicyRecords = Record<string, CommandPolicies>;
// The response of the COMMAND command uses "." to separate the module name from the command name.
// For example, "ft.search" refers to the "search" command in the "ft" module. It is important to use the same naming convention here.
export type ModulePolicyRecords = Record<string, CommandPolicyRecords>;
