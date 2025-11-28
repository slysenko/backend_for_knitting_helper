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
            populate: ["yarnsUsed.yarn", "needlesUsed.needle", "hooksUsed.hook"],
            sort: { updatedAt: -1 },
        });
    }

    async getById(id) {
        const project = await Project.findById(id)
            .populate("yarnsUsed.yarn")
            .populate("needlesUsed.needle")
            .populate("hooksUsed.hook");

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

        if (data.needlesUsed && data.needlesUsed.length > 0) {
            const needleIds = data.needlesUsed.map((n) => n.needle.toString());
            const uniqueNeedleIds = [...new Set(needleIds)];
            if (needleIds.length !== uniqueNeedleIds.length) {
                throw new ValidationError("Cannot add the same needle multiple times to a project");
            }

            const primaryNeedles = data.needlesUsed.filter((n) => n.isPrimary);
            if (primaryNeedles.length > 1) {
                throw new ValidationError("Only one needle can be marked as primary");
            }
        }

        if (data.hooksUsed && data.hooksUsed.length > 0) {
            const hookIds = data.hooksUsed.map((h) => h.hook.toString());
            const uniqueHookIds = [...new Set(hookIds)];
            if (hookIds.length !== uniqueHookIds.length) {
                throw new ValidationError("Cannot add the same hook multiple times to a project");
            }

            const primaryHooks = data.hooksUsed.filter((h) => h.isPrimary);
            if (primaryHooks.length > 1) {
                throw new ValidationError("Only one hook can be marked as primary");
            }
        }

        const project = new Project(data);
        await project.save();

        await project.populate("yarnsUsed.yarn");
        await project.populate("needlesUsed.needle");
        await project.populate("hooksUsed.hook");

        return project;
    }

    async update(id, updateData) {
        const project = await Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate("yarnsUsed.yarn")
            .populate("needlesUsed.needle")
            .populate("hooksUsed.hook");

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

        const project = await Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate("yarnsUsed.yarn")
            .populate("needlesUsed.needle")
            .populate("hooksUsed.hook");

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

        if (yarnData.isPrimary) {
            project.yarnsUsed.forEach((y) => {
                y.isPrimary = false;
            });
        }

        project.yarnsUsed.push(yarnData);
        await project.save();
        await project.populate("yarnsUsed.yarn");
        await project.populate("needlesUsed.needle");
        await project.populate("hooksUsed.hook");

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
        await project.populate("needlesUsed.needle");
        await project.populate("hooksUsed.hook");

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

        yarnUsage.deleteOne();
        await project.save();

        return project;
    }

    async addNeedle(id, needleData) {
        const project = await Project.findById(id);

        if (!project) {
            throw new NotFoundError("Project");
        }

        const existingNeedle = project.needlesUsed.find((n) => n.needle.toString() === needleData.needle);

        if (existingNeedle) {
            throw new ConflictError("Needle already added to this project");
        }

        if (needleData.isPrimary) {
            project.needlesUsed.forEach((n) => {
                n.isPrimary = false;
            });
        }

        project.needlesUsed.push(needleData);
        await project.save();
        await project.populate("yarnsUsed.yarn");
        await project.populate("needlesUsed.needle");
        await project.populate("hooksUsed.hook");

        return project;
    }

    async updateNeedle(projectId, needleUsageId, updateData) {
        const project = await Project.findById(projectId);

        if (!project) {
            throw new NotFoundError("Project");
        }

        const needleUsage = project.needlesUsed.id(needleUsageId);

        if (!needleUsage) {
            throw new NotFoundError("Needle usage");
        }

        Object.assign(needleUsage, updateData);
        await project.save();
        await project.populate("yarnsUsed.yarn");
        await project.populate("needlesUsed.needle");
        await project.populate("hooksUsed.hook");

        return project;
    }

    async removeNeedle(projectId, needleUsageId) {
        const project = await Project.findById(projectId);

        if (!project) {
            throw new NotFoundError("Project");
        }

        const needleUsage = project.needlesUsed.id(needleUsageId);

        if (!needleUsage) {
            throw new NotFoundError("Needle usage");
        }

        needleUsage.deleteOne();
        await project.save();

        return project;
    }

    async addHook(id, hookData) {
        const project = await Project.findById(id);

        if (!project) {
            throw new NotFoundError("Project");
        }

        const existingHook = project.hooksUsed.find((h) => h.hook.toString() === hookData.hook);

        if (existingHook) {
            throw new ConflictError("Hook already added to this project");
        }

        if (hookData.isPrimary) {
            project.hooksUsed.forEach((h) => {
                h.isPrimary = false;
            });
        }

        project.hooksUsed.push(hookData);
        await project.save();
        await project.populate("yarnsUsed.yarn");
        await project.populate("needlesUsed.needle");
        await project.populate("hooksUsed.hook");

        return project;
    }

    async updateHook(projectId, hookUsageId, updateData) {
        const project = await Project.findById(projectId);

        if (!project) {
            throw new NotFoundError("Project");
        }

        const hookUsage = project.hooksUsed.id(hookUsageId);

        if (!hookUsage) {
            throw new NotFoundError("Hook usage");
        }

        Object.assign(hookUsage, updateData);
        await project.save();
        await project.populate("yarnsUsed.yarn");
        await project.populate("needlesUsed.needle");
        await project.populate("hooksUsed.hook");

        return project;
    }

    async removeHook(projectId, hookUsageId) {
        const project = await Project.findById(projectId);

        if (!project) {
            throw new NotFoundError("Project");
        }

        const hookUsage = project.hooksUsed.id(hookUsageId);

        if (!hookUsage) {
            throw new NotFoundError("Hook usage");
        }

        hookUsage.deleteOne();
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
