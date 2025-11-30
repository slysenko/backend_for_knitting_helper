import Joi from "joi";

const gaugeValidation = {
    createGauge: Joi.object({
        project: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        name: Joi.string().required().trim().min(1).max(200),
        gaugeType: Joi.string().valid("blocked", "unblocked").required(),
        comments: Joi.string().allow("").max(2000),
        yarn: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        needle: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        hook: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        stitches: Joi.number().min(0).required(),
        rows: Joi.number().min(0).required(),
        widthCm: Joi.number().min(0).required(),
        heightCm: Joi.number().min(0).required(),
    }).custom((value, helpers) => {
        if (value.needle && value.hook) {
            return helpers.error("object.xor", { peers: ["needle", "hook"] });
        }
        return value;
    }, "needle and hook mutual exclusivity"),

    updateGauge: Joi.object({
        project: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        name: Joi.string().trim().min(1).max(200),
        gaugeType: Joi.string().valid("blocked", "unblocked"),
        comments: Joi.string().allow("").max(2000),
        yarn: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        needle: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        hook: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        stitches: Joi.number().min(0),
        rows: Joi.number().min(0),
        widthCm: Joi.number().min(0),
        heightCm: Joi.number().min(0),
    }).min(1).custom((value, helpers) => {
        if (value.needle && value.hook) {
            return helpers.error("object.xor", { peers: ["needle", "hook"] });
        }
        return value;
    }, "needle and hook mutual exclusivity"),

    addPhoto: Joi.object({
        filePath: Joi.string().required().trim(),
        caption: Joi.string().allow("").max(500),
    }),

    queryParams: Joi.object({
        project: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        gaugeType: Joi.string().valid("blocked", "unblocked"),
    }),
};

export default gaugeValidation;
