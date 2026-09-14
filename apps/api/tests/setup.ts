import { beforeAll, afterAll } from "vitest";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { redis, disconnectRedis } from "../src/config/redis";

beforeAll(async () => {
  await connectDatabase();
  await redis.ping();
});

afterAll(async () => {
  await disconnectDatabase();
  await disconnectRedis();
});