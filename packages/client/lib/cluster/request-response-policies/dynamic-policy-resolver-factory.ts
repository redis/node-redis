import type { CommandReply } from '../../commands/generic-transformers';
import type { CommandPolicies } from './policies-constants';
import { REQUEST_POLICIES_WITH_DEFAULTS, RESPONSE_POLICIES_WITH_DEFAULTS } from './policies-constants';
import type { PolicyResolver } from './types';
import { StaticPolicyResolver } from './static-policy-resolver';
import type { ModulePolicyRecords } from './static-policies-data';

/**
 * Function type that returns command information from Redis
 */
export type CommandFetcher = () => Promise<Array<CommandReply>>;

/**
 * A factory for creating policy resolvers that dynamically build policies based on the Redis server's COMMAND response.
 *
 * This factory fetches command information from Redis and analyzes the response to determine
 * appropriate routing policies for each command, returning a StaticPolicyResolver with the built policies.
 */
export class DynamicPolicyResolverFactory {
  /**
   * Creates a StaticPolicyResolver by fetching command information from Redis
   * and building appropriate policies based on the command characteristics.
   *
   * @param commandFetcher Function to fetch command information from Redis
   * @param fallbackResolver Optional fallback resolver to use when policies are not found
   * @returns A new StaticPolicyResolver with the fetched policies
   */
  static async create(
    commandFetcher: CommandFetcher,
    fallbackResolver?: PolicyResolver
  ): Promise<StaticPolicyResolver> {
    const commands = await commandFetcher();
    const policies: ModulePolicyRecords = {};

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

    return new StaticPolicyResolver(policies, fallbackResolver);
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
   * Builds CommandPolicies for a command based on its characteristics.
   *
   * Priority order:
   * 1. Use explicit policies from the command if available
   * 2. Classify as DEFAULT_KEYLESS if keySpecification is empty
   * 3. Classify as DEFAULT_KEYED if keySpecification is not empty
   */
  static #buildCommandPolicies(command: CommandReply): CommandPolicies {
    // Determine if command is keyless based on keySpecification
    const isKeyless = command.keySpecifications === 'keyless';

    // Determine default policies based on key specification
    const defaultRequest = isKeyless
      ? REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS
      : REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED;
    const defaultResponse = isKeyless
      ? RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS
      : RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED;

    return {
      // request: command.policies.request ?? defaultRequest,
      // response: command.policies.response ?? defaultResponse
      request: defaultRequest,
      response: defaultResponse
    };
  }
}