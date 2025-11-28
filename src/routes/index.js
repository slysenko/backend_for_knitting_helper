import { Router } from "express";
import projectRoutes from "./project_routes.js";
import yarnRoutes from "./yarn_routes.js";
import needleRoutes from "./needle_routes.js";
// import hookRoutes from "./hook.routes";
// import gaugeRoutes from "./gauge.routes";
// import decreaseSchemeRoutes from "./decreaseScheme.routes";
// import conversionRoutes from "./conversion.routes";
// import statsRoutes from "./stats.routes";

const router = Router();

router.use("/projects", projectRoutes);
router.use("/yarns", yarnRoutes);
router.use("/needles", needleRoutes);
// router.use("/hooks", hookRoutes);
// router.use("/gauges", gaugeRoutes);
// router.use("/decrease-schemes", decreaseSchemeRoutes);
// router.use("/conversions", conversionRoutes);
// router.use("/stats", statsRoutes);

export default router;
