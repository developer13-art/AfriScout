import { beforeAll, afterAll } from "vitest";
import { connectDatabase, disconnectDatabase } from "../src/config/database";

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});