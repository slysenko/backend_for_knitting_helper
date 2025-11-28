import Needle from "../models/needle.js";
import { NotFoundError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";
import { extractPaginationParams, applyPagination } from "../utils/pagination.js";

class NeedleService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const paginationParams = extractPaginationParams(filters);

        return await applyPagination(Needle, query, {
            ...paginationParams,
            sort: { sizeMm: 1 },
        });
    }

    async getById(id) {
        const needle = await Needle.findById(id);

        if (!needle) {
            throw new NotFoundError("Needle");
        }

        return needle;
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
