import { createDatabaseQueue } from "../databaseQueue";

export const maintenanceQueue = createDatabaseQueue(1);