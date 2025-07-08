import { Admin } from "@models/Admin";

export async function isAdmin(user_id) {
  const admin = await Admin.findOne({ user_id });
  if (!admin) return false;

  return true;
}
