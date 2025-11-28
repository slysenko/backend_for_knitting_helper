import { Router } from "express";
const router = Router();
import NeedleController from "../controllers/needle_controller.js";
import validation from "../validation/needle_validation.js";
import validate from "../middleware/validation.js";

const {
    queryParams,
    createNeedle,
    updateNeedle,
} = validation;

router.get("/", validate(queryParams, "query"), NeedleController.getNeedles);
router.get("/:id", NeedleController.getNeedleById);
router.post("/", validate(createNeedle), NeedleController.createNeedle);
router.put("/:id", validate(updateNeedle), NeedleController.updateNeedle);
router.delete("/:id", NeedleController.deleteNeedle);

export default router;
