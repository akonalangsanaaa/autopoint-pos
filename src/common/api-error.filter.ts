import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const statusCode = exception.getStatus();
    const body = exception.getResponse();
    const detail = typeof body === 'string' ? { message: body } : body as {
      message?: string | string[];
      errors?: string[];
    };
    const errors = detail.errors ?? (Array.isArray(detail.message) ? detail.message : [detail.message ?? exception.message]);
    host.switchToHttp().getResponse().status(statusCode).json({
      success: false,
      statusCode,
      message: Array.isArray(detail.message) ? 'Request validation failed.' : detail.message ?? exception.message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}
