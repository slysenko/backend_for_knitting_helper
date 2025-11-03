class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends Error {
    constructor(resource = "Resource") {
        super(`${resource} not found`);
        this.name = "NotFoundError";
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

class ConflictError extends Error {
     constructor(message) {
        super(message);
        this.name = "ConflictError";
    }
}

export {
    AppError,
    NotFoundError,
    ValidationError,
    ConflictError,
};
