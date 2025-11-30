import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const gaugeSchema = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        name: { type: String, required: true },
        gaugeType: {
            type: String,
            enum: ["blocked", "unblocked"],
            required: true,
        },
        comments: String,
        yarn: {
            type: Schema.Types.ObjectId,
            ref: "Yarn",
        },
        needle: {
            type: Schema.Types.ObjectId,
            ref: "Needle",
        },
        hook: {
            type: Schema.Types.ObjectId,
            ref: "Hook",
        },
        stitches: { type: Number, required: true },
        rows: { type: Number, required: true },
        widthCm: { type: Number, required: true },
        heightCm: { type: Number, required: true },

        photos: [
            {
                filePath: { type: String, required: true },
                caption: String,
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

gaugeSchema.pre("save", function (next) {
    if (this.needle && this.hook) {
        next(new Error("A gauge cannot have both a needle and a hook"));
    }
    next();
});

gaugeSchema.virtual("stitchesPerCm").get(function () {
    return this.stitches / this.widthCm;
});

gaugeSchema.virtual("rowsPerCm").get(function () {
    return this.rows / this.heightCm;
});

gaugeSchema.virtual("stitchesPerInch").get(function () {
    return (this.stitches / this.widthCm) * 2.54;
});

gaugeSchema.virtual("rowsPerInch").get(function () {
    return (this.rows / this.heightCm) * 2.54;
});

gaugeSchema.set("toJSON", { virtuals: true });
gaugeSchema.set("toObject", { virtuals: true });

gaugeSchema.index({ project: 1 });

const Gauge = model("Gauge", gaugeSchema);

export default Gauge;
