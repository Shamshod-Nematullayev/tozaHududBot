import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor(modelName: string, details?: any) {
    super(`${modelName} not found`, 404, details);
  }
}

export default NotFoundError;
