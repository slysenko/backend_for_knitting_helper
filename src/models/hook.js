import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const hookSchema = new Schema(
    {
        sizeMm: { type: Number, required: true },
        sizeUs: String,
        material: String,
        brand: String,
        price: Number,
        currency: { type: String, default: "EUR" },
        notes: String,
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

hookSchema.index({ sizeMm: 1 });

const Hook = model("Hook", hookSchema);

export default Hook;
