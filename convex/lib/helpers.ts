import { GenericDatabaseReader } from "convex/server"
import { GenericDataModel, GenericId } from "convex/values"

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
