// src/utils/errors.ts
// Based on Who's In/server/src/utils/errors.ts

// Base class for all API errors
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// 400 - Bad Request (e.g., validation errors)
export class BadRequestError extends ApiError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

// 404 - Not Found
export class NotFoundError extends ApiError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

// 500 - Internal Server Error
export class InternalServerError extends ApiError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}
