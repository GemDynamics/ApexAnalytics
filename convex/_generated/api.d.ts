/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai_knowledge_base from "../ai_knowledge_base.js";
import type * as contractActions from "../contractActions.js";
import type * as contractMutations from "../contractMutations.js";
import type * as contractQueries from "../contractQueries.js";
import type * as contractsQueries from "../contractsQueries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai_knowledge_base: typeof ai_knowledge_base;
  contractActions: typeof contractActions;
  contractMutations: typeof contractMutations;
  contractQueries: typeof contractQueries;
  contractsQueries: typeof contractsQueries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
