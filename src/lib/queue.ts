import { Queue } from "bullmq";
import Redis from "ioredis";
import { randomUUID } from "crypto";

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password ? decodeURIComponent(url.password) : undefined,
        username: url.username ? decodeURIComponent(url.username) : undefined,
        maxRetriesPerRequest: null as unknown as number,
      };
    } catch {
      // fall through
    }
  }

  const redisPassword = process.env.REDIS_PASSWORD;
  if (redisPassword) {
    return {
      host: "redis-11215.c262.us-east-1-3.ec2.redns.redis-cloud.com",
      port: 11215,
      password: redisPassword,
      username: "default",
      maxRetriesPerRequest: null as unknown as number,
    };
  }

  throw new Error("Redis connection not configured for BullMQ");
}

export const redisConnection = getRedisConnection();

// Singleton queue instance
let emailQueueInstance: Queue | null = null;

export function getEmailQueue(): Queue {
  if (!emailQueueInstance) {
    emailQueueInstance = new Queue("email", { connection: redisConnection });
  }
  return emailQueueInstance;
}

let batchRedisClient: Redis | null = null;

function getBatchRedis(): Redis {
  if (!batchRedisClient) {
    const conn = getRedisConnection();
    batchRedisClient = new Redis({
      host: conn.host,
      port: conn.port,
      password: conn.password,
      username: conn.username,
      maxRetriesPerRequest: 3,
    });
  }
  return batchRedisClient;
}

const BATCH_PREFIX = "email_batch:";
const BATCH_TTL = 3600; // 1 hour

export interface BatchStatus {
  batchId: string;
  total: number;
  completed: number;
  failed: number;
  failedEmails: string[];
  startedAt: string;
  questionId: number;
}

export async function createBatch(total: number, questionId: number): Promise<string> {
  const batchId = randomUUID();
  const redis = getBatchRedis();
  const key = `${BATCH_PREFIX}${batchId}`;

  // Use a Redis hash for atomic field-level updates
  await redis.hset(key, {
    batchId,
    total: total.toString(),
    completed: "0",
    failed: "0",
    startedAt: new Date().toISOString(),
    questionId: questionId.toString(),
  });
  await redis.expire(key, BATCH_TTL);
  return batchId;
}

export async function updateBatchCompleted(batchId: string): Promise<void> {
  const redis = getBatchRedis();
  const key = `${BATCH_PREFIX}${batchId}`;
  // Atomic increment — no race condition
  await redis.hincrby(key, "completed", 1);
}

export async function updateBatchFailed(batchId: string, email: string): Promise<void> {
  const redis = getBatchRedis();
  const key = `${BATCH_PREFIX}${batchId}`;
  // Atomic increment + atomic list push
  await redis.hincrby(key, "failed", 1);
  await redis.rpush(`${key}:failedEmails`, email);
  await redis.expire(`${key}:failedEmails`, BATCH_TTL);
}

export async function getBatchStatus(batchId: string): Promise<BatchStatus | null> {
  const redis = getBatchRedis();
  const key = `${BATCH_PREFIX}${batchId}`;
  const data = await redis.hgetall(key);
  if (!data || !data.batchId) return null;

  const failedEmails = await redis.lrange(`${key}:failedEmails`, 0, -1);

  return {
    batchId: data.batchId,
    total: parseInt(data.total, 10) || 0,
    completed: parseInt(data.completed, 10) || 0,
    failed: parseInt(data.failed, 10) || 0,
    failedEmails,
    startedAt: data.startedAt || "",
    questionId: parseInt(data.questionId, 10) || 0,
  };
}

// Job data types
export interface InviteEmailJobData {
  to: string;
  recipientName: string;
  questionTitle: string;
  questionId: number;
  inviteLink: string;
  customSubject?: string;
  customBody?: string;
  batchId?: string;
}

export interface BulkInviteJobData {
  invites: InviteEmailJobData[];
}
