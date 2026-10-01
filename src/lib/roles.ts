export const userRoles = ["reader", "creator", "admin"] as const;
export type UserRole = typeof userRoles[number];
export function canUseStudio(role: string | undefined, active = true) {
  return active && (role === "creator" || role === "admin");
}
export function canManageStory(role: string, userId: string, authorId: string | null, active = true) {
  return active && (role === "admin" || (role === "creator" && authorId === userId));
}
