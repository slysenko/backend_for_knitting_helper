import { Router } from "express";
const router = Router();
import HookController from "../controllers/hook_controller.js";
import validation from "../validation/hook_validation.js";
import validate from "../middleware/validation.js";

const {
    queryParams,
    createHook,
    updateHook,
} = validation;

router.get("/", validate(queryParams, "query"), HookController.getHooks);
router.get("/:id", HookController.getHookById);
router.post("/", validate(createHook), HookController.createHook);
router.put("/:id", validate(updateHook), HookController.updateHook);
router.delete("/:id", HookController.deleteHook);

export default router;
