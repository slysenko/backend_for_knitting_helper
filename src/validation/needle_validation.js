import Joi from "joi";

const needleValidation = {
    createNeedle: Joi.object({
        sizeMm: Joi.number().positive().required(),
        sizeUs: Joi.string().trim().max(20),
        type: Joi.string().valid("straight", "circular", "dpn").required(),
        lengthCm: Joi.number().positive(),
        material: Joi.string().trim().max(100),
        brand: Joi.string().trim().max(200),
        price: Joi.number().min(0),
        currency: Joi.string().length(3).uppercase().default("EUR"),
        notes: Joi.string().allow("").max(2000),
    }),

    updateNeedle: Joi.object({
        sizeMm: Joi.number().positive(),
        sizeUs: Joi.string().trim().max(20),
        type: Joi.string().valid("straight", "circular", "dpn"),
        lengthCm: Joi.number().positive(),
        material: Joi.string().trim().max(100),
        brand: Joi.string().trim().max(200),
        price: Joi.number().min(0),
        currency: Joi.string().length(3).uppercase(),
        notes: Joi.string().allow("").max(2000),
    }).min(1),

    queryParams: Joi.object({
        type: Joi.string().valid("straight", "circular", "dpn"),
        sizeMm: Joi.number().positive(),
        material: Joi.string().trim(),
        brand: Joi.string().trim(),
    }),
};

export default needleValidation;
