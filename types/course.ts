/**
 * Mirrors the `NodeType` enum in prisma/schema.prisma. Kept as a plain string
 * union (rather than importing from @prisma/client) so client components can
 * use it without pulling in the Prisma client bundle.
 */
export type NodeType =
  | "FOLDER"
  | "VIDEO"
  | "PDF"
  | "DOCUMENT"
  | "IMAGE"
  | "LINK"
  | "QUIZ"
  | "ASSIGNMENT"
  | "TEXT";
