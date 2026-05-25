import { OracleSessionTable } from "@/db/schema";

export type OracleSession = typeof OracleSessionTable.$inferSelect;
