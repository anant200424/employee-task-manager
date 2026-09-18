export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // Enterprise Static Factory Helpers
  static badRequest(message = "Bad request.", errors?: Record<string, string>): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Authentication required or invalid credentials."): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = "You do not have permission to perform this action."): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found."): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = "Resource already exists or conflict occurred.", errors?: Record<string, string>): ApiError {
    return new ApiError(409, message, errors);
  }

  static locked(message = "Resource is temporarily locked."): ApiError {
    return new ApiError(423, message);
  }

  static internal(message = "An unexpected error occurred. Please try again later."): ApiError {
    return new ApiError(500, message);
  }
}

