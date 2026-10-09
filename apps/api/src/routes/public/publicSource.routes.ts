import { Router } from "express";
import * as Controller from "../../controllers/source.controller";

const router = Router();

router.get("/", Controller.list);
router.get("/:id", Controller.get);

export default router;