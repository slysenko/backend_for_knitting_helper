const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const decreaseSchemeSchema = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        name: { type: String, required: true },
        comments: String,
        totalStitches: { type: Number, required: true },
        totalRows: { type: Number, required: true },
        schemeData: { type: String, required: true }, // JSON string or structured data
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

decreaseSchemeSchema.index({ project: 1 });

decreaseSchemeSchema.methods.getParsedSchemeData = function () {
    try {
        return JSON.parse(this.schemeData);
    } catch (e) {
        return null;
    }
};

decreaseSchemeSchema.methods.setSchemeData = function (data) {
    this.schemeData = JSON.stringify(data);
};

const DecreaseScheme = mongoose.model("DecreaseScheme", decreaseSchemeSchema);

module.exports = DecreaseScheme;
