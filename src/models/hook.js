const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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

const Hook = mongoose.model("Hook", hookSchema);

module.exports = Hook;
