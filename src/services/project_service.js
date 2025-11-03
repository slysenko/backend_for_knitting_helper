import Project from "../models/project.js";
import { NotFoundError, ConflictError } from "../middleware/errors.js";

class ProjectService {
    async getAll(filters = {}) {
        const query = {};

        if (filters.status) query.status = filters.status;
        if (filters.projectType) query.projectType = filters.projectType;

        const projects = await Project.find(query)
            .populate("primaryYarn")
            .populate("yarnsUsed.yarn")
            .sort({ updatedAt: -1 });

        return projects;
    }

    async getById(id) {
        const project = await Project.findById(id).populate("primaryYarn").populate("yarnsUsed.yarn");

        if (!project) {
            throw new NotFoundError("Project");
        }

        return project;
    }

    async create(data) {
        const project = new Project(data);
        await project.save();

        await project.populate("primaryYarn");

        return project;
    }

    async update(id, updateData) {
        const project = await Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate("primaryYarn")
            .populate("yarnsUsed.yarn");

        if (!project) {
            throw new NotFoundError("Project");
        }

        return project;
    }

    async delete(id) {
        const project = await Project.findByIdAndDelete(id);

        if (!project) {
            throw new NotFoundError("Project");
        }

        return project;
    }

    async updateStatus(id, statusData) {
        const updateData = { status: statusData.status };

        if (statusData.status === "completed" && statusData.completionDate) {
            updateData.completionDate = statusData.completionDate;
        }

        const project = await Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(
            "primaryYarn",
        );

        if (!project) {
            throw new NotFoundError("Project");
        }

        return project;
    }

    async addPhoto(id, photoData) {
        const project = await Project.findById(id);

        if (!project) {
            throw new NotFoundError("Project");
        }

        project.photos.push(photoData);
        await project.save();

        return project;
    }

    async addYarn(id, yarnData) {
        const project = await Project.findById(id);

        if (!project) {
            throw new NotFoundError("Project");
        }

        const existingYarn = project.yarnsUsed.find((y) => y.yarn.toString() === yarnData.yarn);

        if (existingYarn) {
            throw new ConflictError("Yarn already added to this project");
        }

        project.yarnsUsed.push(yarnData);
        await project.save();
        await project.populate("yarnsUsed.yarn");

        return project;
    }

    async updateYarn(projectId, yarnUsageId, updateData) {
        const project = await Project.findById(projectId);

        if (!project) {
            throw new NotFoundError("Project");
        }

        const yarnUsage = project.yarnsUsed.id(yarnUsageId);

        if (!yarnUsage) {
            throw new NotFoundError("Yarn usage");
        }

        Object.assign(yarnUsage, updateData);
        await project.save();
        await project.populate("yarnsUsed.yarn");

        return project;
    }

    async removeYarn(projectId, yarnUsageId) {
        const project = await Project.findById(projectId);

        if (!project) {
            throw new NotFoundError("Project");
        }

        const yarnUsage = project.yarnsUsed.id(yarnUsageId);

        if (!yarnUsage) {
            throw new NotFoundError("Yarn usage");
        }

        yarnUsage.remove();
        await project.save();

        return project;
    }

    async addCost(id, costData) {
        const project = await Project.findById(id);

        if (!project) {
            throw new NotFoundError("Project");
        }

        project.additionalCosts.push(costData);
        await project.save();

        return project;
    }

    async getCostSummary(id) {
        const project = await Project.findById(id).populate("yarnsUsed.yarn");

        if (!project) {
            throw new NotFoundError("Project");
        }

        const summary = {
            yarnCost: project.totalYarnCost,
            additionalCost: project.totalAdditionalCost,
            totalCost: project.totalProjectCost,
            currency: project.yarnsUsed[0]?.currency || "EUR",
            breakdown: {
                yarns: project.yarnsUsed.map((y) => ({
                    yarnId: y.yarn?._id,
                    yarnName: y.yarn?.name,
                    quantity: y.quantityUsed,
                    unit: y.quantityUnit,
                    costPerUnit: y.costPerUnit,
                    total: y.quantityUsed * (y.costPerUnit || 0),
                })),
                additional: project.additionalCosts.map((c) => ({
                    description: c.description,
                    amount: c.amount,
                    category: c.category,
                    purchaseDate: c.purchaseDate,
                })),
            },
        };

        return summary;
    }
}

export default new ProjectService();
