import Yarn from "../models/yarn.js";
import { NotFoundError, ConflictError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";
import { extractPaginationParams, applyPagination } from "../utils/pagination.js";

class YarnService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const paginationParams = extractPaginationParams(filters);

        return await applyPagination(Yarn, query, {
            ...paginationParams,
            sort: { updatedAt: -1 },
        });
    }

    async getById(id) {
        const yarn = await Yarn.findById(id).populate({
            path: "usedInProjects",
            select: "name projectType status startDate completionDate",
        });

        if (!yarn) {
            throw new NotFoundError("Yarn");
        }

        return yarn;
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
