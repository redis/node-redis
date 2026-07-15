import type { CommandReply } from '../commands/generic-transformers';
import type { CommandMetadata } from './policies-constants';
import { REQUEST_POLICIES_WITH_DEFAULTS, RESPONSE_POLICIES_WITH_DEFAULTS } from './policies-constants';
import type { PolicyResolver, ModuleMetadataRecords } from './types';
import { StaticMetadataResolver } from './static-metadata-resolver';

/**
 * Function type that returns command information from Redis
 */
export type CommandFetcher = () => Promise<Array<CommandReply>>;

/**
 * A factory for creating policy resolvers that dynamically build policies based on the Redis server's COMMAND response.
 *
 * This factory fetches command information from Redis and analyzes the response to determine
 * appropriate routing policies for each command, returning a StaticMetadataResolver with the built policies.
 */
export class DynamicPolicyResolverFactory {
  /**
   * Creates a StaticMetadataResolver by fetching command information from Redis
   * and building appropriate policies based on the command characteristics.
   *
   * @param commandFetcher Function to fetch command information from Redis
   * @param fallbackResolver Optional fallback resolver to use when policies are not found
   * @returns A new StaticMetadataResolver with the fetched policies
   */
  static async create(
    commandFetcher: CommandFetcher,
    fallbackResolver?: PolicyResolver
  ): Promise<PolicyResolver> {
    const commands = await commandFetcher();
    const policies = DynamicPolicyResolverFactory.buildModuleMetadataRecords(commands);

    return new StaticMetadataResolver(policies, fallbackResolver);
  }

  /**
   * Builds module->command policy records from COMMAND replies.
   *
   * Also used by `scripts/generate-command-metadata-data.ts` to regenerate
   * `command-metadata-data.ts`, so the static data is guaranteed to match what
   * this factory would derive at runtime.
   */
  static buildModuleMetadataRecords(commands: Array<CommandReply>): ModuleMetadataRecords {
    const policies: ModuleMetadataRecords = {};

    for (const command of commands) {
      const parsed = DynamicPolicyResolverFactory.#parseCommandName(command.name);

      // Skip commands with invalid format (more than one dot)
      if (!parsed) {
        continue;
      }

      const { moduleName, commandName } = parsed;

      // Initialize module if it doesn't exist
      if (!policies[moduleName]) {
        policies[moduleName] = {};
      }

      // Determine policies for this command
      const commandPolicies = DynamicPolicyResolverFactory.#buildCommandPolicies(command);
      policies[moduleName][commandName] = commandPolicies;
    }

    return policies;
  }

  /**
   * Parses a command name to extract module and command components.
   *
   * Redis commands can be in format:
   * - "ping" -> module: "std", command: "ping"
   * - "ft.search" -> module: "ft", command: "search"
   *
   * Commands with more than one dot are invalid.
   */
  static #parseCommandName(fullCommandName: string): { moduleName: string; commandName: string } | null {
    const parts = fullCommandName.split('.');

    if (parts.length === 1) {
      return { moduleName: 'std', commandName: fullCommandName };
    }

    if (parts.length === 2) {
      return { moduleName: parts[0], commandName: parts[1] };
    }

    // Commands with more than one dot are invalid in Redis
    return null;
  }

  /**
   * Builds CommandMetadata for a command based on its characteristics.
   *
   * Priority order:
   * 1. Use explicit policies from the command if available
   * 2. Classify as DEFAULT_KEYLESS if keySpecification is empty
   * 3. Classify as DEFAULT_KEYED if keySpecification is not empty
   */
  static #buildCommandPolicies(command: CommandReply): CommandMetadata {
    // Determine if command is keyless based on keySpecification
    const isKeyless = command.isKeyless

    // Determine default policies based on key specification
    const defaultRequest = isKeyless
      ? REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS
      : REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED;
    const defaultResponse = isKeyless
      ? RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS
      : RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED;
    
    let subcommands: Record<string, CommandMetadata> | undefined;
    if(command.subcommands.length > 0) {
      subcommands = {};
      for (const subcommand of command.subcommands) {

        // Subcommands are in format "parentCommand|subcommand"
        const parts = subcommand.name.split("|")
        if(parts.length !== 2) {
          throw new Error(`Invalid subcommand name: ${subcommand.name}`);
        }
        const subcommandName = parts[1];

        subcommands[subcommandName] = DynamicPolicyResolverFactory.#buildCommandPolicies(subcommand);
      }
    }

    const request = command.policies.request ?? defaultRequest;

    return {
      request,
      response: command.policies.response ?? defaultResponse,
      isKeyless,
      // Mirror the raw server signals verbatim. Derivation (replica-safety,
      // CSC eligibility) is NOT precomputed here — it lives in the
      // `isReplicaSafe` / `isCacheable` predicates, so the static table and a
      // dynamic live-`COMMAND` resolver feed the identical algorithm.
      flags: [...command.flags],
      tips: command.tips.length ? command.tips : undefined,
      // Only the multi_shard splitter consumes key specs. This builder also
      // produces command-metadata-data.ts, so copying them unconditionally
      // would pollute the generated data with specs nothing reads
      // (~tripling the file).
      keySpecs: request === REQUEST_POLICIES_WITH_DEFAULTS.MULTI_SHARD
        ? command.keySpecs
        : undefined,
      subcommands
    };
  }
}