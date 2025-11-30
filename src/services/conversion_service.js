import Conversion from "../models/conversion.js";
import Gauge from "../models/gauge.js";
import { NotFoundError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";
import { extractPaginationParams, applyPagination } from "../utils/pagination.js";

class ConversionService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const paginationParams = extractPaginationParams(filters);

        const result = await applyPagination(Conversion, query, {
            ...paginationParams,
            sort: { createdAt: -1 },
            populate: {
                path: "gauge",
                select: "name gaugeType stitches rows widthCm heightCm",
            },
        });

        return result;
    }

    async getById(id) {
        const conversion = await Conversion.findById(id).populate({
            path: "gauge",
            select: "name gaugeType stitches rows widthCm heightCm project",
            populate: {
                path: "project",
                select: "name",
            },
        });

        if (!conversion) {
            throw new NotFoundError("Conversion");
        }

        return conversion;
    }

    async create(data) {
        const gauge = await Gauge.findById(data.gauge);
        if (!gauge) {
            throw new NotFoundError("Gauge");
        }

        const conversion = new Conversion(data);
        return await conversion.save();
    }

    async update(id, updateData) {
        if (updateData.gauge) {
            const gauge = await Gauge.findById(updateData.gauge);
            if (!gauge) {
                throw new NotFoundError("Gauge");
            }
        }

        const conversion = await Conversion.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate({
            path: "gauge",
            select: "name gaugeType stitches rows widthCm heightCm",
        });

        if (!conversion) {
            throw new NotFoundError("Conversion");
        }

        return conversion;
    }

    async delete(id) {
        const conversion = await Conversion.findByIdAndDelete(id);

        if (!conversion) {
            throw new NotFoundError("Conversion");
        }

        return conversion;
    }

    async getByGaugeId(gaugeId) {
        const gauge = await Gauge.findById(gaugeId);
        if (!gauge) {
            throw new NotFoundError("Gauge");
        }

        const conversions = await Conversion.find({ gauge: gaugeId }).sort({ createdAt: -1 });

        return conversions;
    }
}

export default new ConversionService();
