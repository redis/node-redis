import { OTEL_ATTRIBUTES, OTelClientAttributes } from "../types";

export { getErrorInfo } from "./error.util";
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
