import {
  ArenaSocketServer,
  initArenaWebSocketServer,
} from "@/features/arena/server/websocket";
import { NextApiRequest, NextApiResponse } from "next";
import { Socket } from "node:net";

type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: ArenaSocketServer;
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
  initArenaWebSocketServer(res.socket.server);

  return res.status(200).json({
    ok: true,
    wsPath: "/api/arena/ws",
  });
};

export default handler;
