import { GenericDatabaseReader } from "convex/server"
import { GenericDataModel, GenericId } from "convex/values"

/**
 * Verify that a document belongs to the given user.
 * Used for personal-scope operations.
 */
export async function verifyOwnership<DataModel extends GenericDataModel>(
  db: GenericDatabaseReader<DataModel>,
  id: GenericId<any>,
  userId: string
) {
  const doc = await db.get(id)
  if (!doc || (doc as any).userId !== userId) {
    throw new Error("Not found or unauthorized")
  }
  return doc
}

/**
 * Verify that a document belongs to the given organization.
 * Used for org-scope operations where any org member with
 * appropriate role can access.
 */
export async function verifyOrgAccess<DataModel extends GenericDataModel>(
  db: GenericDatabaseReader<DataModel>,
  id: GenericId<any>,
  orgId: string
) {
  const doc = await db.get(id)
  if (!doc || (doc as any).orgId !== orgId) {
    throw new Error("Not found or unauthorized")
  }
  return doc
}

/**
 * Verify that a document belongs to the user AND the org.
 * Strictest check — used when only the creator should modify.
 */
export async function verifyOwnershipInOrg<DataModel extends GenericDataModel>(
  db: GenericDatabaseReader<DataModel>,
  id: GenericId<any>,
  userId: string,
  orgId: string
) {
  const doc = await db.get(id)
  if (!doc || (doc as any).userId !== userId || (doc as any).orgId !== orgId) {
    throw new Error("Not found or unauthorized")
  }
  return doc
}
