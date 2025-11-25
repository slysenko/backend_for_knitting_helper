import { Router } from "express";
const router = Router();
import YarnController from "../controllers/yarn_controller.js";
import validation from "../validation/yarn_validation.js";
import validate from "../middleware/validation.js";

const {
    queryParams,
    createYarn,
    updateYarn,
    addPhoto,
} = validation;

router.get("/", validate(queryParams, "query"), YarnController.getYarns);
router.get("/:id", YarnController.getYarnById);
router.post("/", validate(createYarn), YarnController.createYarn);
router.put("/:id", validate(updateYarn), YarnController.updateYarn);
router.delete("/:id", YarnController.deleteYarn);
router.post("/:id/photos", validate(addPhoto), YarnController.addYarnPhoto);

export default router;