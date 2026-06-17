// Custom error klasslari

class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 400, errors);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Autentifikatsiya talab etiladi') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Bu amalni bajarish uchun ruxsatingiz yo'q") {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resurs') {
    super(`${resource} topilmadi`, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Ma\'lumot allaqachon mavjud') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class ExternalServiceError extends AppError {
  constructor(service = 'Tashqi xizmat', message = null) {
    super(message || `${service} bilan bog'lanishda xato`, 502);
    this.name = 'ExternalServiceError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
};
