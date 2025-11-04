import { AppError } from "@errors/AppError.js";

export class NotFoundError extends AppError {
  constructor(modelName: string, details?: any) {
    super(`${modelName} not found`, 404, details);
  }
}

export default NotFoundError;
