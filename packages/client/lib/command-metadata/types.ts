import { CommandIdentifier } from '../client/parser';
import type { CommandMetadata } from './policies-constants';

export type Either<TOk, TError> =
  | { readonly ok: true; readonly value: TOk }
  | { readonly ok: false; readonly error: TError };

export type PolicyResult = Either<CommandMetadata, 'unknown-command' | 'unknown-module' | 'wrong-command-or-module-name'>;

export interface PolicyResolver {
  /**
   * The response of the COMMAND command uses "." to separate the module name from the command name.
   */
  resolvePolicy(commandIdentifier: CommandIdentifier): PolicyResult;

  /**
   * Convenience over `resolvePolicy`: returns the resolved metadata or
   * `undefined` on any miss, for the override-first predicates
   * (`isReplicaSafe(resolver.lookup(id), command.IS_READ_ONLY)`).
   */
  lookup(commandIdentifier: CommandIdentifier): CommandMetadata | undefined;
}

/**
 * Parses a `COMMAND`-style command name into its module/command parts:
 * `"ping"` → `std.ping`, `"ft.search"` → `ft.search`. More than one dot is
 * invalid in Redis → `undefined`. Callers own case normalization.
 */
export function parseCommandName(fullCommandName: string): { moduleName: string; commandName: string } | undefined {
  const parts = fullCommandName.split('.');
  if (parts.length === 1) return { moduleName: 'std', commandName: fullCommandName };
  if (parts.length === 2) return { moduleName: parts[0], commandName: parts[1] };
  return undefined;
}

export type CommandMetadataRecords = Record<string, CommandMetadata>;
// The response of the COMMAND command uses "." to separate the module name from the command name.
// For example, "ft.search" refers to the "search" command in the "ft" module. It is important to use the same naming convention here.
export type ModuleMetadataRecords = Record<string, CommandMetadataRecords>;
