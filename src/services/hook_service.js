import Hook from "../models/hook.js";
import Project from "../models/project.js";
import { NotFoundError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";
import { extractPaginationParams, applyPagination } from "../utils/pagination.js";

class HookService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const paginationParams = extractPaginationParams(filters);

        const result = await applyPagination(Hook, query, {
            ...paginationParams,
            sort: { sizeMm: 1 },
        });

        if (result.data && result.data.length > 0) {
            const hookIds = result.data.map((hook) => hook._id);
            const projectCounts = await Project.aggregate([
                { $match: { "hooksUsed.hook": { $in: hookIds } } },
                { $unwind: "$hooksUsed" },
                { $match: { "hooksUsed.hook": { $in: hookIds } } },
                { $group: { _id: "$hooksUsed.hook", count: { $sum: 1 } } },
            ]);

            const countMap = new Map(projectCounts.map((item) => [item._id.toString(), item.count]));

            result.data = result.data.map((hook) => {
                const hookObj = hook.toObject();
                hookObj.projectCount = countMap.get(hook._id.toString()) || 0;
                return hookObj;
            });
        }

        return result;
    }

    async getById(id) {
        const hook = await Hook.findById(id).populate({
            path: "usedInProjects",
            select: "name projectType status startDate completionDate",
        });

        if (!hook) {
            throw new NotFoundError("Hook");
        }

        const hookObj = hook.toObject();
        hookObj.projectCount = hookObj.usedInProjects ? hookObj.usedInProjects.length : 0;

        return hookObj;
    }

    async create(data) {
        const hook = new Hook(data);
        return await hook.save();
    }

    async update(id, updateData) {
        const hook = await Hook.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!hook) {
            throw new NotFoundError("Hook");
        }

        return hook;
    }

    async delete(id) {
        const hook = await Hook.findByIdAndDelete(id);

        if (!hook) {
            throw new NotFoundError("Hook");
        }

        return hook;
    }
}

export default new HookService();
