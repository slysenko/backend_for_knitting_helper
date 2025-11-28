import NeedleService from "../services/needle_service.js";

class NeedleController {
    async getNeedles(req, res, next) {
        try {
            const result = await NeedleService.getAll(req.query);

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async getNeedleById(req, res, next) {
        try {
            const needle = await NeedleService.getById(req.params.id);

            res.json({
                success: true,
                data: needle,
            });
        } catch (error) {
            next(error);
        }
    }

    async createNeedle(req, res, next) {
        try {
            const needle = await NeedleService.create(req.body);

            res.status(201).json({
                success: true,
                message: "Needle created successfully",
                data: needle,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateNeedle(req, res, next) {
        try {
            const needle = await NeedleService.update(req.params.id, req.body);

            res.json({
                success: true,
                message: "Needle updated successfully",
                data: needle,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteNeedle(req, res, next) {
        try {
            await NeedleService.delete(req.params.id);

            res.json({
                success: true,
                message: "Needle deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new NeedleController();
