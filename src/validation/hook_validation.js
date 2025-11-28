import Joi from "joi";

const hookValidation = {
    createHook: Joi.object({
        sizeMm: Joi.number().positive().required(),
        sizeUs: Joi.string().trim().max(50),
        material: Joi.string().trim().max(100),
        brand: Joi.string().trim().max(200),
        price: Joi.number().min(0),
        currency: Joi.string().length(3).uppercase().default("EUR"),
        notes: Joi.string().allow("").max(2000),
    }),

    updateHook: Joi.object({
        sizeMm: Joi.number().positive(),
        sizeUs: Joi.string().trim().max(50),
        material: Joi.string().trim().max(100),
        brand: Joi.string().trim().max(200),
        price: Joi.number().min(0),
        currency: Joi.string().length(3).uppercase(),
        notes: Joi.string().allow("").max(2000),
    }).min(1),

    queryParams: Joi.object({
        material: Joi.string().trim(),
        brand: Joi.string().trim(),
        sizeMm: Joi.number().positive(),
    }),
};

export default hookValidation;
