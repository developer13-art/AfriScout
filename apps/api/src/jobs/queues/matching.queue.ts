import { createDatabaseQueue } from "../databaseQueue";
import { env } from "../../config/env";

export const matchingQueue = createDatabaseQueue(env.JOB_ATTEMPTS_DEFAULT);