import { createDatabaseQueue } from "../databaseQueue";
import { env } from "../../config/env";

export const webhookQueue = createDatabaseQueue(env.OUTBOUND_WEBHOOK_MAX_ATTEMPTS);