/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity_mutations from "../activity/mutations.js";
import type * as activity_queries from "../activity/queries.js";
import type * as agents_mutations from "../agents/mutations.js";
import type * as agents_queries from "../agents/queries.js";
import type * as jobs_mutations from "../jobs/mutations.js";
import type * as jobs_queries from "../jobs/queries.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as memory_mutations from "../memory/mutations.js";
import type * as memory_queries from "../memory/queries.js";
import type * as skills_mutations from "../skills/mutations.js";
import type * as skills_queries from "../skills/queries.js";
import type * as tasks_mutations from "../tasks/mutations.js";
import type * as tasks_queries from "../tasks/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "activity/mutations": typeof activity_mutations;
  "activity/queries": typeof activity_queries;
  "agents/mutations": typeof agents_mutations;
  "agents/queries": typeof agents_queries;
  "jobs/mutations": typeof jobs_mutations;
  "jobs/queries": typeof jobs_queries;
  "lib/helpers": typeof lib_helpers;
  "memory/mutations": typeof memory_mutations;
  "memory/queries": typeof memory_queries;
  "skills/mutations": typeof skills_mutations;
  "skills/queries": typeof skills_queries;
  "tasks/mutations": typeof tasks_mutations;
  "tasks/queries": typeof tasks_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
