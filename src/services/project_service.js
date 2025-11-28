import Project from "../models/project.js";
import { NotFoundError, ValidationError, ConflictError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";
import { extractPaginationParams, applyPagination } from "../utils/pagination.js";

class ProjectService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const paginationParams = extractPaginationParams(filters);

        return await applyPagination(Project, query, {
            ...paginationParams,
            populate: "yarnsUsed.yarn",
            sort: { updatedAt: -1 },
        });
    }

    async getById(id) {
        const project = await Project.findById(id).populate("yarnsUsed.yarn");

        if (!project) {
            throw new NotFoundError("Project");
        }

        return project;
    }

    async create(data) {
        if (data.yarnsUsed && data.yarnsUsed.length > 0) {
            const yarnIds = data.yarnsUsed.map((y) => y.yarn.toString());
            const uniqueYarnIds = [...new Set(yarnIds)];
            if (yarnIds.length !== uniqueYarnIds.length) {
                throw new ValidationError("Cannot add the same yarn multiple times to a project");
            }

            const primaryYarns = data.yarnsUsed.filter((y) => y.isPrimary);
            if (primaryYarns.length > 1) {
                throw new ValidationError("Only one yarn can be marked as primary");
            }
        }

        const project = new Project(data);
        await project.save();

        await project.populate("yarnsUsed.yarn");

        return project;
    }

    async update(id, updateData) {
        const project = await Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(
            "yarnsUsed.yarn",
        );

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
            "yarnsUsed.yarn",
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

        const existingYarn = project.yarnsUsed.find((y) => y.id.toString() === yarnData.yarn);

        if (existingYarn) {
            throw new ConflictError("Yarn already added to this project");
        }

        if (yarnData.isPrimary) {
            project.yarnsUsed.forEach((y) => {
                y.isPrimary = false;
            });
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

        const yarnUsage = project.yarnsUsed.yarn(yarnUsageId);

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

        const yarnUsage = project.yarnsUsed.yarn(yarnUsageId);

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
