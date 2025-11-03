import Joi from 'joi';

const projectValidation = {

    createProject: Joi.object({
        name: Joi.string().required().trim().min(1).max(200),
        comments: Joi.string().allow("").max(2000),
        projectType: Joi.string().valid("knitting", "crochet").required(),
        primaryYarn: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        status: Joi.string().valid("active", "completed", "frogged", "hibernating").default("active"),
        startDate: Joi.date().iso(),
        completionDate: Joi.date().iso().greater(Joi.ref("startDate")),
    }),

    updateProject: Joi.object({
        name: Joi.string().trim().min(1).max(200),
        comments: Joi.string().allow("").max(2000),
        projectType: Joi.string().valid("knitting", "crochet"),
        primaryYarn: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        status: Joi.string().valid("active", "completed", "frogged", "hibernating"),
        startDate: Joi.date().iso(),
        completionDate: Joi.date().iso(),
    }).min(1),

    updateStatus: Joi.object({
        status: Joi.string().valid("active", "completed", "frogged", "hibernating").required(),
        completionDate: Joi.date().iso(),
    }),

    addPhoto: Joi.object({
        filePath: Joi.string().required().trim(),
        isPrimary: Joi.boolean().default(false),
        photoType: Joi.string().valid("progress", "finished", "detail", "inspiration", "other"),
        caption: Joi.string().allow("").max(500),
        takenAt: Joi.date().iso(),
    }),

    addYarn: Joi.object({
        yarn: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required(),
        quantityUsed: Joi.number().positive().required(),
        quantityUnit: Joi.string().valid("skeins", "balls", "grams", "meters").default("skeins"),
        costPerUnit: Joi.number().min(0),
        currency: Joi.string().length(3).uppercase().default("EUR"),
        notes: Joi.string().allow("").max(500),
    }),

    updateYarn: Joi.object({
        quantityUsed: Joi.number().positive(),
        quantityUnit: Joi.string().valid("skeins", "balls", "grams", "meters"),
        costPerUnit: Joi.number().min(0),
        currency: Joi.string().length(3).uppercase(),
        notes: Joi.string().allow("").max(500),
    }).min(1),

    addCost: Joi.object({
        description: Joi.string().required().trim().min(1).max(200),
        amount: Joi.number().positive().required(),
        currency: Joi.string().length(3).uppercase().default("EUR"),
        category: Joi.string().valid("notions", "pattern", "tools", "other"),
        purchaseDate: Joi.date().iso(),
        notes: Joi.string().allow("").max(500),
    }),

    queryParams: Joi.object({
        status: Joi.string().valid("active", "completed", "frogged", "hibernating"),
        projectType: Joi.string().valid("knitting", "crochet"),
    }),
};

export default projectValidation;
