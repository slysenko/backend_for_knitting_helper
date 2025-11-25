import YarnService from "../services/yarn_service.js";

class YarnController {
    async getYarns(req, res, next) {
        try {
            const yarns = await YarnService.getAll(req.query);

            res.json({
                success: true,
                data: yarns,
                count: yarns.length,
            });
        } catch (error) {
            next(error);
        }
    }

    async getYarnById(req, res, next) {
        try {
            const yarn = await YarnService.getById(req.params.id);

            res.json({
                success: true,
                data: yarn,
            });
        } catch (error) {
            next(error);
        }
    }

    async createYarn(req, res, next) {
        try {
            const yarn = await YarnService.create(req.body);

            res.status(201).json({
                success: true,
                message: "Yarn created successfully",
                data: yarn,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateYarn(req, res, next) {
        try {
            const yarn = await YarnService.update(req.params.id, req.body);

            res.json({
                success: true,
                message: "Yarn updated successfully",
                data: yarn,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteYarn(req, res, next) {
        try {
            await YarnService.delete(req.params.id);

            res.json({
                success: true,
                message: "Yarn deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async addYarnPhoto(req, res, next) {
        try {
            const yarn = await YarnService.addPhoto(req.params.id, req.body);

            res.status(201).json({
                success: true,
                message: "Photo added successfully",
                data: yarn,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new YarnController();
