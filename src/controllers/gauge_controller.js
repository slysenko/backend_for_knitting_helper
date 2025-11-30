import GaugeService from "../services/gauge_service.js";

class GaugeController {
    async getGauges(req, res, next) {
        try {
            const result = await GaugeService.getAll(req.query);

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async getGaugeById(req, res, next) {
        try {
            const gauge = await GaugeService.getById(req.params.id);

            res.json({
                success: true,
                data: gauge,
            });
        } catch (error) {
            next(error);
        }
    }

    async createGauge(req, res, next) {
        try {
            const gauge = await GaugeService.create(req.body);

            res.status(201).json({
                success: true,
                message: "Gauge created successfully",
                data: gauge,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateGauge(req, res, next) {
        try {
            const gauge = await GaugeService.update(req.params.id, req.body);

            res.json({
                success: true,
                message: "Gauge updated successfully",
                data: gauge,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteGauge(req, res, next) {
        try {
            await GaugeService.delete(req.params.id);

            res.json({
                success: true,
                message: "Gauge deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async addGaugePhoto(req, res, next) {
        try {
            const gauge = await GaugeService.addPhoto(req.params.id, req.body);

            res.status(201).json({
                success: true,
                message: "Photo added successfully",
                data: gauge,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new GaugeController();
