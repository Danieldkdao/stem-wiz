import { RealtimeSocketServer } from "@/features/realtime/lib/types";
import { initRealtimeWebSocket } from "@/features/realtime/server/websocket";
import { NextApiRequest, NextApiResponse } from "next";
import { Socket } from "node:net";

type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: RealtimeSocketServer;
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (
  _req: NextApiRequest,
  res: NextApiResponseWithSocket,
) => {
  initRealtimeWebSocket(res.socket.server);

  return res.status(200).json({
    ok: true,
    wsPath: "/api/realtime/ws",
  });
};

export default handler;
