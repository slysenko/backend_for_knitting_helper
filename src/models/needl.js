const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const needleSchema = new Schema(
    {
        sizeMm: { type: Number, required: true },
        sizeUs: String,
        type: {
            type: String,
            required: true,
            enum: ["straight", "circular", "dpn"],
        },
        lengthCm: Number,
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

needleSchema.index({ sizeMm: 1 });

const Needle = mongoose.model("Needle", needleSchema);

module.exports = Needle;
