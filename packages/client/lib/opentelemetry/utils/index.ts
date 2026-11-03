import { Attributes, MetricOptions, OTEL_ATTRIBUTES, OTelClientAttributes } from "../types";

export { getErrorInfo, isRedirectionError } from "./error.util";
export type { ErrorInfo } from "./error.util";

export function noopFunction() {}

export const parseClientAttributes = (
  clientAttributes?: OTelClientAttributes,
) => {
  return {
    ...(clientAttributes?.db === undefined
      ? {}
      : {
          [OTEL_ATTRIBUTES.dbNamespace]: clientAttributes.db.toString(),
        }),
    ...(clientAttributes?.host && {
      [OTEL_ATTRIBUTES.serverAddress]: clientAttributes.host,
    }),
    ...(clientAttributes?.port && {
      [OTEL_ATTRIBUTES.serverPort]: clientAttributes.port.toString(),
    }),
    ...(clientAttributes?.clientId && {
      [OTEL_ATTRIBUTES.dbClientConnectionPoolName]: clientAttributes.clientId,
    }),
    ...(clientAttributes?.parentId && {
      [OTEL_ATTRIBUTES.redisClientParentId]: clientAttributes.parentId,
    }),
  };
};

// Custom attributes are merged last, so they override the built-in ones:
// client-level first, then process-level. With neither set, the call site's
// object is passed through as is.
export const withCustomAttributes = (
  options: MetricOptions,
  clientAttributes: OTelClientAttributes | undefined,
  attributes: Attributes,
): Attributes => {
  const clientCustomAttributes = clientAttributes?.customAttributes;
  if (!clientCustomAttributes && !options.hasCustomAttributes) {
    return attributes;
  }

  return {
    ...attributes,
    ...options.customAttributes,
    ...clientCustomAttributes,
  };
};
