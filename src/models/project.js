import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const projectSchema = new Schema(
    {
        name: { type: String, required: true },
        comments: String,
        projectType: {
            type: String,
            required: true,
            enum: ["knitting", "crochet"],
        },
        primaryYarn: {
            type: Schema.Types.ObjectId,
            ref: "Yarn",
        },
        status: {
            type: String,
            default: "active",
            enum: ["active", "completed", "frogged", "hibernating"],
        },
        startDate: Date,
        completionDate: Date,

        photos: [
            {
                filePath: { type: String, required: true },
                isPrimary: { type: Boolean, default: false },
                photoType: {
                    type: String,
                    enum: ["progress", "finished", "detail", "inspiration", "other"],
                },
                caption: String,
                takenAt: Date,
                createdAt: { type: Date, default: Date.now },
            },
        ],

        yarnsUsed: [
            {
                yarn: {
                    type: Schema.Types.ObjectId,
                    ref: "Yarn",
                    required: true,
                },
                quantityUsed: { type: Number, required: true },
                quantityUnit: {
                    type: String,
                    default: "skeins",
                    enum: ["skeins", "balls", "grams", "meters"],
                },
                costPerUnit: Number,
                currency: { type: String, default: "EUR" },
                notes: String,
            },
        ],

        additionalCosts: [
            {
                description: { type: String, required: true },
                amount: { type: Number, required: true },
                currency: { type: String, default: "EUR" },
                category: {
                    type: String,
                    enum: ["notions", "pattern", "tools", "other"],
                },
                purchaseDate: Date,
                notes: String,
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    },
);

projectSchema.index({ status: 1 });
projectSchema.index({ projectType: 1 });
projectSchema.index({ "yarnsUsed.yarn": 1 });

projectSchema.virtual("totalYarnCost").get(function () {
    return this.yarnsUsed.reduce((total, yarn) => {
        return total + yarn.quantityUsed * (yarn.costPerUnit || 0);
    }, 0);
});

projectSchema.virtual("totalAdditionalCost").get(function () {
    return this.additionalCosts.reduce((total, cost) => {
        return total + cost.amount;
    }, 0);
});

projectSchema.virtual("totalProjectCost").get(function () {
    return this.totalYarnCost + this.totalAdditionalCost;
});

projectSchema.set("toJSON", { virtuals: true });
projectSchema.set("toObject", { virtuals: true });

const Project = model("Project", projectSchema);

export default Project;
