import { Router } from "express";
import projectRoutes from "./project_routes.js";
import yarnRoutes from "./yarn_routes.js";
import needleRoutes from "./needle_routes.js";
import hookRoutes from "./hook_routes.js";
import gaugeRoutes from "./gauge_routes.js";
import conversionRoutes from "./conversion_routes.js";
// import decreaseSchemeRoutes from "./decreaseScheme.routes";
// import statsRoutes from "./stats.routes";

const router = Router();

router.use("/projects", projectRoutes);
router.use("/yarns", yarnRoutes);
router.use("/needles", needleRoutes);
router.use("/hooks", hookRoutes);
router.use("/gauges", gaugeRoutes);
router.use("/conversions", conversionRoutes);
// router.use("/decrease-schemes", decreaseSchemeRoutes);
// router.use("/stats", statsRoutes);

export default router;
