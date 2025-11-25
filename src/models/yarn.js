import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const yarnSchema = new Schema(
    {
        name: { type: String, required: true },
        brand: String,
        yarnType: String, // "Worsted", "DK", "Fingering", etc.
        fiberContent: String,
        color: String,
        lotNumber: String,
        length: Number,
        lengthUnit: {
            type: String,
            enum: ["meters", "yards", "feet"],
            default: "meters",
        },
        weight: Number,
        weightUnit: {
            type: String,
            enum: ["grams", "ounces", "pounds"],
            default: "grams",
        },
        pricePerUnit: Number,
        currency: { type: String, default: "EUR" },
        purchaseDate: Date,
        purchaseLocation: String,
        quantityInStash: { type: Number, default: 1 },
        notes: String,

        photos: [
            {
                filePath: { type: String, required: true },
                isPrimary: { type: Boolean, default: false },
                caption: String,
                takenAt: Date,
                createdAt: { type: Date, default: Date.now },
            },
        ],

        links: [
            {
                url: { type: String, required: true },
                linkType: {
                    type: String,
                    required: true,
                    enum: ["shop", "ravelry", "manufacturer", "review", "other"],
                },
                description: String,
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    },
);

yarnSchema.index({ brand: 1, name: 1 });
yarnSchema.index({ yarnType: 1 });
yarnSchema.index({ quantityInStash: 1 });

// Virtual field to show which projects use this yarn
yarnSchema.virtual("usedInProjects", {
    ref: "Project",
    localField: "_id",
    foreignField: "yarnsUsed.yarn",
});

yarnSchema.set("toJSON", { virtuals: true });
yarnSchema.set("toObject", { virtuals: true });

const Yarn = model("Yarn", yarnSchema);

export default Yarn;
