import Joi from "joi";

const yarnValidation = {
    createYarn: Joi.object({
        name: Joi.string().required().trim().min(1).max(200),
        notes: Joi.string().allow("").max(2000),
        projectType: Joi.string().valid("knitting", "crochet").required(),
        startDate: Joi.date().iso(),
        completionDate: Joi.date().iso().greater(Joi.ref("startDate")),
    }),

    updateYarn: Joi.object({
        name: Joi.string().trim().min(1).max(200),
        comments: Joi.string().allow("").max(2000),
        projectType: Joi.string().valid("knitting", "crochet"),
        startDate: Joi.date().iso(),
        completionDate: Joi.date().iso(),
    }).min(1),

    addPhoto: Joi.object({
        filePath: Joi.string().required().trim(),
        isPrimary: Joi.boolean().default(false),
        caption: Joi.string().allow("").max(500),
        takenAt: Joi.date().iso(),
    }),

    queryParams: Joi.object({
        status: Joi.string().valid("active", "completed", "frogged", "hibernating"),
        projectType: Joi.string().valid("knitting", "crochet"),
    }),
};

export default projectValidation;
