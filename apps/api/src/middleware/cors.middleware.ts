import cors from "cors";
import { corsOptions } from "../config/cors";

export const corsMiddleware = cors(corsOptions);