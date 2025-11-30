import { Router } from "express";
const router = Router();
import ConversionController from "../controllers/conversion_controller.js";
import validation from "../validation/conversion_validation.js";
import validate from "../middleware/validation.js";

const { queryParams, createConversion, updateConversion } = validation;

router.get("/", validate(queryParams, "query"), ConversionController.getConversions);
router.get("/:id", ConversionController.getConversionById);
router.get("/gauge/:gaugeId", ConversionController.getConversionsByGaugeId);
router.post("/", validate(createConversion), ConversionController.createConversion);
router.put("/:id", validate(updateConversion), ConversionController.updateConversion);
router.delete("/:id", ConversionController.deleteConversion);

export default router;
