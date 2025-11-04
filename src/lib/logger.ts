// utils/logger.ts
import winston from "winston";
import { DatabaseTransport } from "./database-transport";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
  transports: [
    new DatabaseTransport(), // Store logs in DB
  ],
});

// Console logs for development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export function log(
  level: "info" | "error" | "warn",
  message: string,
  userId?: string,
  isAuthenticated: boolean = false,
  extraData?: object
) {
  logger.log(level, message, {
    timestamp: new Date().toISOString(),
    userId: userId || "anonymous",
    isAuthenticated,
    ...extraData,
  });
}

export default logger;
