import { Router } from "express";
import * as Controller from "../../controllers/pipeline.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  pipelineCreateSchema,
  pipelineMoveSchema,
  pipelineNoteSchema,
  updateChecklistSchema,
  outcomeSchema,
} from "../../validators/pipeline.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", Controller.listPipelines);
router.get("/items", Controller.listItems);
router.get("/items/:itemId", Controller.getItem);
router.post("/items", validate({ body: pipelineCreateSchema }), Controller.add);
router.patch("/items/:itemId/stage", validate({ body: pipelineMoveSchema }), Controller.move);
router.delete("/items/:itemId", Controller.remove);
router.put("/items/:itemId/checklist", validate({ body: updateChecklistSchema }), Controller.updateChecklist);
router.post("/items/:itemId/notes", validate({ body: pipelineNoteSchema }), Controller.addNote);
router.post("/items/:itemId/submission", Controller.submission);
router.post("/items/:itemId/outcome", validate({ body: outcomeSchema }), Controller.outcome);

export default router;