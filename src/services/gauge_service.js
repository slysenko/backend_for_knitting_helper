import Gauge from "../models/gauge.js";
import { NotFoundError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";
import { extractPaginationParams, applyPagination } from "../utils/pagination.js";

class GaugeService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const paginationParams = extractPaginationParams(filters);

        const result = await applyPagination(Gauge, query, {
            ...paginationParams,
            sort: { createdAt: -1 },
            populate: [
                { path: "project", select: "name projectType status" },
                { path: "yarn", select: "name brand color yarnType" },
                { path: "needle", select: "sizeMm type" },
                { path: "hook", select: "sizeMm type" },
            ],
        });

        return result;
    }

    async getById(id) {
        const gauge = await Gauge.findById(id)
            .populate("project", "name projectType status startDate completionDate")
            .populate("yarn", "name brand color yarnType fiberContent")
            .populate("needle", "sizeMm type material")
            .populate("hook", "sizeMm type material");

        if (!gauge) {
            throw new NotFoundError("Gauge");
        }

        return gauge;
    }

    async create(data) {
        const gauge = new Gauge(data);
        return await gauge.save();
    }

    async update(id, updateData) {
        const gauge = await Gauge.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!gauge) {
            throw new NotFoundError("Gauge");
        }

        return gauge;
    }

    async delete(id) {
        const gauge = await Gauge.findByIdAndDelete(id);

        if (!gauge) {
            throw new NotFoundError("Gauge");
        }

        return gauge;
    }

    async addPhoto(id, photoData) {
        const gauge = await Gauge.findById(id);

        if (!gauge) {
            throw new NotFoundError("Gauge");
        }

        gauge.photos.push(photoData);
        await gauge.save();

        return gauge;
    }
}

export default new GaugeService();
