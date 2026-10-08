import { createDatabaseQueue } from "../databaseQueue";
import { env } from "../../config/env";

export const notificationQueue = createDatabaseQueue(env.JOB_ATTEMPTS_DEFAULT);