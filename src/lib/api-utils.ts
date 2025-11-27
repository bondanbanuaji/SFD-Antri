import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

/**
 * Create standardized success response
 */
export function apiSuccess<T>(data: T, meta?: Partial<ApiResponse['meta']>): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    });
}

/**
 * Create standardized error response
 */
export function apiError(
    message: string,
    code: string = 'INTERNAL_ERROR',
    status: number = 500,
    details?: any
): NextResponse<ApiResponse> {
    return NextResponse.json(
        {
            success: false,
            error: {
                code,
                message,
                details,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        },
        { status }
    );
}

/**
 * Create validation error response
 */
export function apiValidationError(errors: any): NextResponse<ApiResponse> {
    return NextResponse.json(
        {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Input validation failed',
                details: errors,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        },
        { status: 400 }
    );
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any): NextResponse<ApiResponse> {
    console.error('[API Error]', error);

    // Prisma errors
    if (error.code?.startsWith('P')) {
        return apiError('Database error occurred', 'DATABASE_ERROR', 500);
    }

    // Validation errors
    if (error.name === 'ZodError') {
        return apiValidationError(error.errors);
    }

    // Default error
    return apiError(
        error.message || 'An unexpected error occurred',
        error.code || 'INTERNAL_ERROR',
        error.status || 500
    );
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequest<T>(
    request: Request,
    schema: any
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
    try {
        const body = await request.json();
        const validated = schema.parse(body);
        return { data: validated, error: null };
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return { data: null, error: apiValidationError(error.errors) };
        }
        return { data: null, error: handleApiError(error) };
    }
}
