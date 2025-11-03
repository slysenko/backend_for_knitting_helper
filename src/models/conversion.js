const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversionSchema = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        gauge: {
            type: Schema.Types.ObjectId,
            ref: "Gauge",
            required: true,
        },
        name: { type: String, required: true },
        comments: String,
        conversionData: { type: String, required: true }, // JSON string or structured data
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

// Indexes for querying conversions
conversionSchema.index({ project: 1 });
conversionSchema.index({ gauge: 1 });
conversionSchema.index({ project: 1, gauge: 1 });

// Method to parse conversion data as JSON
conversionSchema.methods.getParsedConversionData = function () {
    try {
        return JSON.parse(this.conversionData);
    } catch (e) {
        return null;
    }
};

// Method to set conversion data from object
conversionSchema.methods.setConversionData = function (data) {
    this.conversionData = JSON.stringify(data);
};

const Conversion = mongoose.model("Conversion", conversionSchema);

module.exports = Conversion;
