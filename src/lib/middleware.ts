import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from './redis';
import { z, ZodSchema } from 'zod';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function withErrorHandler(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof APIError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode }
        );
      }

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export function withRateLimit(
  maxRequests: number = 100,
  windowSeconds: number = 60
) {
  return function (handler: Function) {
    return async (req: NextRequest, context?: any) => {
      const identifier = 
        req.headers.get('x-forwarded-for') || 
        req.headers.get('x-real-ip') || 
        'unknown';

      const { allowed, remaining, resetAt } = await rateLimiter.checkLimit(
        identifier,
        maxRequests,
        windowSeconds
      );

      const response = allowed
        ? await handler(req, context)
        : NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
          );

      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', resetAt.toString());

      return response;
    };
  };
}

export function withValidation(schema: ZodSchema) {
  return function (handler: Function) {
    return async (req: NextRequest, context?: any) => {
      const body = await req.json().catch(() => ({}));
      const validated = schema.parse(body);
      
      return handler(req, context, validated);
    };
  };
}

export function withAuth(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Verify JWT token
    // For now, pass through
    return handler(req, context);
  };
}

export function compose(...middlewares: Function[]) {
  return function (handler: Function) {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}
