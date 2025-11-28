import Joi from "joi";

const yarnValidation = {
    createYarn: Joi.object({
        name: Joi.string().required().trim().min(1).max(200),
        brand: Joi.string().trim().max(200),
        yarnType: Joi.string().trim().max(100),
        fiberContent: Joi.string().trim().max(500),
        color: Joi.string().trim().max(100),
        lotNumber: Joi.string().trim().max(100),
        length: Joi.number().min(0),
        lengthUnit: Joi.string().valid("meters", "yards", "feet"),
        weight: Joi.number().min(0),
        weightUnit: Joi.string().valid("grams", "ounces", "pounds"),
        pricePerUnit: Joi.number().min(0),
        currency: Joi.string().trim().max(10),
        purchaseDate: Joi.date().iso(),
        purchaseLocation: Joi.string().trim().max(500),
        quantityInStash: Joi.number().integer().min(0),
        notes: Joi.string().allow("").max(2000),
    }),

    updateYarn: Joi.object({
        name: Joi.string().trim().min(1).max(200),
        brand: Joi.string().trim().max(200),
        yarnType: Joi.string().trim().max(100),
        fiberContent: Joi.string().trim().max(500),
        color: Joi.string().trim().max(100),
        lotNumber: Joi.string().trim().max(100),
        length: Joi.number().min(0),
        lengthUnit: Joi.string().valid("meters", "yards", "feet"),
        weight: Joi.number().min(0),
        weightUnit: Joi.string().valid("grams", "ounces", "pounds"),
        pricePerUnit: Joi.number().min(0),
        currency: Joi.string().trim().max(10),
        purchaseDate: Joi.date().iso(),
        purchaseLocation: Joi.string().trim().max(500),
        quantityInStash: Joi.number().integer().min(0),
        notes: Joi.string().allow("").max(2000),
    }).min(1),

    addPhoto: Joi.object({
        filePath: Joi.string().required().trim(),
        isPrimary: Joi.boolean().default(false),
        caption: Joi.string().allow("").max(500),
        takenAt: Joi.date().iso(),
    }),

    queryParams: Joi.object({
        brand: Joi.string().trim(),
        yarnType: Joi.string().trim(),
        color: Joi.string().trim(),
    }),
};

export default yarnValidation;
