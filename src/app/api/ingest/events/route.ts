import { jsonError } from "@/lib/ingestion/http";

export async function POST() {
  return jsonError(501, "not_implemented", "Event ingestion is deferred to a later phase.");
}
