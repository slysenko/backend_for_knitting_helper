import Yarn from "../models/yarn.js";
import Project from "../models/project.js";
import { NotFoundError, ConflictError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";
import { extractPaginationParams, applyPagination } from "../utils/pagination.js";

class YarnService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const paginationParams = extractPaginationParams(filters);

        const result = await applyPagination(Yarn, query, {
            ...paginationParams,
            sort: { updatedAt: -1 },
        });

        if (result.data && result.data.length > 0) {
            const yarnIds = result.data.map((yarn) => yarn._id);
            const projectCounts = await Project.aggregate([
                { $match: { "yarnsUsed.yarn": { $in: yarnIds } } },
                { $unwind: "$yarnsUsed" },
                { $match: { "yarnsUsed.yarn": { $in: yarnIds } } },
                { $group: { _id: "$yarnsUsed.yarn", count: { $sum: 1 } } },
            ]);

            const countMap = new Map(projectCounts.map((item) => [item._id.toString(), item.count]));

            result.data = result.data.map((yarn) => {
                const yarnObj = yarn.toObject();
                yarnObj.projectCount = countMap.get(yarn._id.toString()) || 0;
                return yarnObj;
            });
        }

        return result;
    }

    async getById(id) {
        const yarn = await Yarn.findById(id).populate({
            path: "usedInProjects",
            select: "name projectType status startDate completionDate",
        });

        if (!yarn) {
            throw new NotFoundError("Yarn");
        }

        const yarnObj = yarn.toObject();
        yarnObj.projectCount = yarnObj.usedInProjects ? yarnObj.usedInProjects.length : 0;

        return yarnObj;
    }

    async create(data) {
        const yarn = new Yarn(data);
        return await yarn.save();
    }

    async update(id, updateData) {
        const yarn = await Yarn.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!yarn) {
            throw new NotFoundError("Yarn");
        }

        return yarn;
    }

    async delete(id) {
        const yarn = await Yarn.findByIdAndDelete(id);

        if (!yarn) {
            throw new NotFoundError("Yarn");
        }

        return yarn;
    }

    async addPhoto(id, photoData) {
        const yarn = await Yarn.findById(id);

        if (!yarn) {
            throw new NotFoundError("Yarn");
        }

        yarn.photos.push(photoData);
        await yarn.save();

        return yarn;
    }
}

export default new YarnService();
