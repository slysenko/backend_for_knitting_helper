import { Router } from "express";
const router = Router();
import GaugeController from "../controllers/gauge_controller.js";
import validation from "../validation/gauge_validation.js";
import validate from "../middleware/validation.js";

const {
    queryParams,
    createGauge,
    updateGauge,
    addPhoto,
} = validation;

router.get("/", validate(queryParams, "query"), GaugeController.getGauges);
router.get("/:id", GaugeController.getGaugeById);
router.post("/", validate(createGauge), GaugeController.createGauge);
router.put("/:id", validate(updateGauge), GaugeController.updateGauge);
router.delete("/:id", GaugeController.deleteGauge);
router.post("/:id/photos", validate(addPhoto), GaugeController.addGaugePhoto);

export default router;
