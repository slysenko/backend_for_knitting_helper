import Hook from "../models/hook.js";
import { NotFoundError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";
import { extractPaginationParams, applyPagination } from "../utils/pagination.js";

class HookService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const paginationParams = extractPaginationParams(filters);

        return await applyPagination(Hook, query, {
            ...paginationParams,
            sort: { sizeMm: 1 },
        });
    }

    async getById(id) {
        const hook = await Hook.findById(id);

        if (!hook) {
            throw new NotFoundError("Hook");
        }

        return hook;
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
