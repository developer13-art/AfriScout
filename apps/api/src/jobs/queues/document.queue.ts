import { createDatabaseQueue } from "../databaseQueue";

export const documentQueue = createDatabaseQueue(3);