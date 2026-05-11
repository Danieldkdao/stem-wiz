import { envServer } from "@/data/env/server";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  console.log("WHAT IS HERE:", body);

  const response = await fetch(
    `${envServer.CODE_EXECUTION_BASE_URL}/api/v2/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();
  return NextResponse.json(data);
};
