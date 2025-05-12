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
import type * as contracts from "../contracts.js";
import type * as contractsQueries from "../contractsQueries.js";
import type * as gemini from "../gemini.js";
import type * as kbProcessing from "../kbProcessing.js";
import type * as knowledge from "../knowledge.js";
import type * as knowledgeQueries from "../knowledgeQueries.js";
import type * as utils_llmUtils from "../utils/llmUtils.js";

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
  contracts: typeof contracts;
  contractsQueries: typeof contractsQueries;
  gemini: typeof gemini;
  kbProcessing: typeof kbProcessing;
  knowledge: typeof knowledge;
  knowledgeQueries: typeof knowledgeQueries;
  "utils/llmUtils": typeof utils_llmUtils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
