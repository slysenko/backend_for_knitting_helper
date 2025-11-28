import ProjectService from "../services/project_service.js";

class ProjectController {
    async getProjects(req, res, next) {
        try {
            const result = await ProjectService.getAll(req.query);
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjectById(req, res, next) {
        try {
            const project = await ProjectService.getById(req.params.id);

            res.json({
                success: true,
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async createProject(req, res, next) {
        try {
            const project = await ProjectService.create(req.body);

            res.status(201).json({
                success: true,
                message: "Project created successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProject(req, res, next) {
        try {
            const project = await ProjectService.update(req.params.id, req.body);

            res.json({
                success: true,
                message: "Project updated successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProject(req, res, next) {
        try {
            await ProjectService.delete(req.params.id);

            res.json({
                success: true,
                message: "Project deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProjectStatus(req, res, next) {
        try {
            const project = await ProjectService.updateStatus(req.params.id, req.body);

            res.json({
                success: true,
                message: "Project status updated successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async addProjectPhoto(req, res, next) {
        try {
            const project = await ProjectService.addPhoto(req.params.id, req.body);

            res.status(201).json({
                success: true,
                message: "Photo added successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async addYarnToProject(req, res, next) {
        try {
            const project = await ProjectService.addYarn(req.params.id, req.body);

            res.status(201).json({
                success: true,
                message: "Yarn added to project successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateYarnInProject(req, res, next) {
        try {
            const project = await ProjectService.updateYarn(req.params.id, req.params.yarnUsageId, req.body);

            res.json({
                success: true,
                message: "Yarn usage updated successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async removeYarnFromProject(req, res, next) {
        try {
            const project = await ProjectService.removeYarn(req.params.id, req.params.yarnUsageId);

            res.json({
                success: true,
                message: "Yarn removed from project successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async addCostToProject(req, res, next) {
        try {
            const project = await ProjectService.addCost(req.params.id, req.body);

            res.status(201).json({
                success: true,
                message: "Cost added successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjectCostSummary(req, res, next) {
        try {
            const summary = await ProjectService.getCostSummary(req.params.id);

            res.json({
                success: true,
                data: summary,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ProjectController();
