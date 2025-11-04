// utils/DatabaseTransport.ts
import Transport from "winston-transport";
import { db } from "@/db/drizzle";
import { logs } from "@/db/schema";

interface LogInfo {
  level: string;
  message: string;
  userId?: string;
  isAuthenticated?: boolean;
  [key: string]: unknown;
}

export class DatabaseTransport extends Transport {
  async log(info: LogInfo, callback: () => void) {
    setImmediate(() => this.emit("logged", info));

    const { level, message, userId, isAuthenticated, ...meta } = info;

    try {
      await db.insert(logs).values({
        level,
        message,
        userId: userId || "anonymous",
        isAuthenticated: isAuthenticated || false,
        extraData: meta,
      });
    } catch (error) {
      console.error("Database logging failed:", error);
    }

    callback();
  }
}
