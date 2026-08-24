import type { OperationType } from "../types";
import { TRANSACTION_PROFILE_MAP } from "./profiles";
import type { TransactionRouteResult } from "./types";

export function routeTransaction(input: unknown): TransactionRouteResult {
  if (typeof input !== "string") return { operation:null,status:"UNKNOWN",reasons:["operation.type mancante"] };
  const op = input as OperationType;
  const profile = TRANSACTION_PROFILE_MAP[op];
  if (!profile) return { operation:op,status:"UNSUPPORTED",reasons:["tipo operazione non supportato dal Brain corrente"] };
  return { operation:op,profile,status:"ROUTED",reasons:[] };
}
