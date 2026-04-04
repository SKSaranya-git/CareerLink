/** Mongo populated employer object or raw ObjectId string */
export function getEmployerId(job) {
  const e = job?.employer;
  if (!e) return null;
  if (typeof e === "object" && e._id != null) return String(e._id);
  if (typeof e === "string") return e;
  return null;
}
