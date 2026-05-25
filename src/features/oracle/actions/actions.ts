"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import {
  oracleSessionCreationSchema,
  OracleSessionCreationSchemaType,
} from "./schemas";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { insertOracleSession } from "../server/oracle-sessions";

export const createNewSessionAction = async (
  unsafeData: OracleSessionCreationSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { success, data } = oracleSessionCreationSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const createdSession = await insertOracleSession({ userId, ...data });

    if (!createdSession) {
      throw new Error("Failed to create session.");
    }

    return {
      error: false,
      message: "Session created successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
