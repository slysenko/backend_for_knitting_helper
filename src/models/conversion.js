import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const conversionSchema = new Schema(
    {
        gauge: {
            type: Schema.Types.ObjectId,
            ref: "Gauge",
            required: true,
        },
        name: String,
        comments: String,

        fromValue: { type: Number, required: true },
        fromUnit: {
            type: String,
            enum: ["stitches", "rows", "cm", "inches"],
            required: true
        },

        toValue: { type: Number, required: true },
        toUnit: {
            type: String,
            enum: ["stitches", "rows", "cm", "inches"],
            required: true
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

conversionSchema.index({ gauge: 1 });

const Conversion = model("Conversion", conversionSchema);

export default Conversion;
