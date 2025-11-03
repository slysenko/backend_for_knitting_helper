import { NotFoundError } from "./errors.js";

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: err.details.map((d) => d.message),
        });
    }

    if (err instanceof NotFoundError) {
        return res.status(404).json({
            success: false,
            message: err.message || "Resource not found",
        });
    }

    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`,
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};

export default errorHandler;
