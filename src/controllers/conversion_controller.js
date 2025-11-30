import ConversionService from "../services/conversion_service.js";

class ConversionController {
    async getConversions(req, res, next) {
        try {
            const result = await ConversionService.getAll(req.query);

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async getConversionById(req, res, next) {
        try {
            const conversion = await ConversionService.getById(req.params.id);

            res.json({
                success: true,
                data: conversion,
            });
        } catch (error) {
            next(error);
        }
    }

    async getConversionsByGaugeId(req, res, next) {
        try {
            const conversions = await ConversionService.getByGaugeId(req.params.gaugeId);

            res.json({
                success: true,
                data: conversions,
            });
        } catch (error) {
            next(error);
        }
    }

    async createConversion(req, res, next) {
        try {
            const conversion = await ConversionService.create(req.body);

            res.status(201).json({
                success: true,
                message: "Conversion created successfully",
                data: conversion,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateConversion(req, res, next) {
        try {
            const conversion = await ConversionService.update(req.params.id, req.body);

            res.json({
                success: true,
                message: "Conversion updated successfully",
                data: conversion,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteConversion(req, res, next) {
        try {
            await ConversionService.delete(req.params.id);

            res.json({
                success: true,
                message: "Conversion deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ConversionController();
