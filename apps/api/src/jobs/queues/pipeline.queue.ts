import { createDatabaseQueue } from "../databaseQueue";
import { env } from "../../config/env";

export const pipelineQueue = createDatabaseQueue(env.JOB_ATTEMPTS_DEFAULT);