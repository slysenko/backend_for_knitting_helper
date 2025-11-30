import Joi from "joi";

const conversionValidation = {
    createConversion: Joi.object({
        gauge: Joi.string().required().hex().length(24),
        name: Joi.string().trim().min(1).max(200),
        comments: Joi.string().allow("").max(1000),
        fromValue: Joi.number().required().min(0),
        fromUnit: Joi.string().required().valid("stitches", "rows", "cm", "inches"),
        toValue: Joi.number().required().min(0),
        toUnit: Joi.string().required().valid("stitches", "rows", "cm", "inches"),
    }),

    updateConversion: Joi.object({
        name: Joi.string().trim().min(1).max(200),
        comments: Joi.string().allow("").max(1000),
        fromValue: Joi.number().min(0),
        fromUnit: Joi.string().valid("stitches", "rows", "cm", "inches"),
        toValue: Joi.number().min(0),
        toUnit: Joi.string().valid("stitches", "rows", "cm", "inches"),
    }).min(1),

    queryParams: Joi.object({
        gauge: Joi.string().hex().length(24),
    }),
};

export default conversionValidation;
