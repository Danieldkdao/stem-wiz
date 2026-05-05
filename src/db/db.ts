import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { envServer } from "@/data/env/server";
import * as schema from "./schema";

const sql = neon(envServer.DATABASE_URL);
export const db = drizzle({ client: sql, schema });
