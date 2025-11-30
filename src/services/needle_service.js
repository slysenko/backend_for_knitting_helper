import Needle from "../models/needle.js";
import Project from "../models/project.js";
import { NotFoundError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";
import { extractPaginationParams, applyPagination } from "../utils/pagination.js";

class NeedleService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const paginationParams = extractPaginationParams(filters);

        const result = await applyPagination(Needle, query, {
            ...paginationParams,
            sort: { sizeMm: 1 },
        });

        if (result.data && result.data.length > 0) {
            const needleIds = result.data.map((needle) => needle._id);
            const projectCounts = await Project.aggregate([
                { $match: { "needlesUsed.needle": { $in: needleIds } } },
                { $unwind: "$needlesUsed" },
                { $match: { "needlesUsed.needle": { $in: needleIds } } },
                { $group: { _id: "$needlesUsed.needle", count: { $sum: 1 } } },
            ]);

            const countMap = new Map(projectCounts.map((item) => [item._id.toString(), item.count]));

            result.data = result.data.map((needle) => {
                const needleObj = needle.toObject();
                needleObj.projectCount = countMap.get(needle._id.toString()) || 0;
                return needleObj;
            });
        }

        return result;
    }

    async getById(id) {
        const needle = await Needle.findById(id).populate({
            path: "usedInProjects",
            select: "name projectType status startDate completionDate",
        });

        if (!needle) {
            throw new NotFoundError("Needle");
        }

        const needleObj = needle.toObject();
        needleObj.projectCount = needleObj.usedInProjects ? needleObj.usedInProjects.length : 0;

        return needleObj;
    }

    async create(data) {
        const needle = new Needle(data);
        return await needle.save();
    }

    async update(id, updateData) {
        const needle = await Needle.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!needle) {
            throw new NotFoundError("Needle");
        }

        return needle;
    }

    async delete(id) {
        const needle = await Needle.findByIdAndDelete(id);

        if (!needle) {
            throw new NotFoundError("Needle");
        }

        return needle;
    }
}

export default new NeedleService();
