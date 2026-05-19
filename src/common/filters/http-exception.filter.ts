import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly message: string;
    readonly code: string;
    readonly statusCode: number;
    readonly timestamp: string;
    readonly path: string;
    readonly details?: readonly string[];
  };
}

function toErrorMessageList(value: unknown): readonly string[] | undefined {
  if (Array.isArray(value)) {
    const messages = value
      .filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
      .map((item) => item.trim());

    return messages.length > 0 ? messages : undefined;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }

  return undefined;
}

function buildErrorPayload(
  exception: HttpException,
  path: string,
): ApiErrorResponse {
  const statusCode = exception.getStatus();
  const response = exception.getResponse();

  let message = 'Nao foi possivel concluir a operacao. Tente novamente.';
  let details: readonly string[] | undefined;

  if (typeof response === 'string') {
    message = response;
  } else if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    const responseMessage = record.message;
    const responseError = record.error;

    if (
      typeof responseMessage === 'string' &&
      responseMessage.trim().length > 0
    ) {
      message = responseMessage.trim();
    } else if (
      Array.isArray(responseMessage) ||
      typeof responseMessage === 'string'
    ) {
      const messages = toErrorMessageList(responseMessage);
      if (messages?.length) {
        message = messages[0];
        details = messages;
      }
    }

    if (!details) {
      details =
        toErrorMessageList(record.details) ?? toErrorMessageList(record.errors);
    }

    if (
      typeof responseError === 'string' &&
      responseError.trim().length > 0 &&
      message === 'Nao foi possivel concluir a operacao. Tente novamente.'
    ) {
      message = responseError.trim();
    }
  }

  const statusName = (HttpStatus as unknown as Record<number, string>)[
    statusCode
  ];
  const code = statusName ?? 'INTERNAL_SERVER_ERROR';

  return {
    success: false,
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path,
      ...(details?.length ? { details } : {}),
    },
  };
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    response
      .status(exception.getStatus())
      .json(buildErrorPayload(exception, request.url));
  }
}
