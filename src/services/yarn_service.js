import Yarn from "../models/yarn.js";
import { NotFoundError, ConflictError } from "../middleware/errors.js";
import { buildQuery } from "../utils/queryBuilder.js";

class YarnService {
    async getAll(filters = {}) {
        const query = buildQuery(filters);
        const yarns = await Yarn.find(query).sort({ updatedAt: -1 });
        return yarns;
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
