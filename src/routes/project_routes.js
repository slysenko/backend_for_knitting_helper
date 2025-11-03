import { Router } from "express";
const router = Router();
import ProjectController from "../controllers/project_controller.js";
import validation from "../validation/project_validation.js";
import validate from "../middleware/validation.js";

const {
    queryParams,
    createProject,
    updateProject,
    updateStatus,
    addPhoto,
    addYarn,
    updateYarn,
    addCost,
} = validation;

router.get("/", validate(queryParams, "query"), ProjectController.getProjects);
router.get("/:id", ProjectController.getProjectById);
router.post("/", validate(createProject), ProjectController.createProject);
router.put("/:id", validate(updateProject), ProjectController.updateProject);
router.delete("/:id", ProjectController.deleteProject);
router.patch("/:id/status", validate(updateStatus), ProjectController.updateProjectStatus);
router.post("/:id/photos", validate(addPhoto), ProjectController.addProjectPhoto);
router.post("/:id/yarns", validate(addYarn), ProjectController.addYarnToProject);
router.put("/:id/yarns/:yarnUsageId", validate(updateYarn), ProjectController.updateYarnInProject);
router.delete("/:id/yarns/:yarnUsageId", ProjectController.removeYarnFromProject);
router.post("/:id/costs", validate(addCost), ProjectController.addCostToProject);
router.get("/:id/costs/summary", ProjectController.getProjectCostSummary);

export default router;
