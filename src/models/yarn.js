import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const yarnSchema = new Schema(
    {
        name: { type: String, required: true },
        brand: String,
        weight: String, // "Worsted", "DK", "Fingering", etc.
        fiberContent: String,
        color: String,
        lotNumber: String,
        lengthMeters: Number,
        weightGrams: Number,
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
yarnSchema.index({ weight: 1 });
yarnSchema.index({ quantityInStash: 1 });

const Yarn = model("Yarn", yarnSchema);

export default Yarn;
