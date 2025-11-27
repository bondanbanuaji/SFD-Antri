import { NextRequest, NextResponse } from 'next/server';
import { revokeToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Get token from cookie
        const token = request.cookies.get('auth-token')?.value;

        if (token) {
            // Add token to blacklist
            await revokeToken(token);
        }

        const response = NextResponse.json(
            { success: true, message: 'Berhasil logout' },
            { status: 200 }
        );

        // Clear auth cookie
        response.cookies.delete('auth-token');

        return response;
    } catch (error) {
        console.error('Logout error:', error);

        // Still clear cookie even if blacklist fails
        const response = NextResponse.json(
            { success: true, message: 'Berhasil logout' },
            { status: 200 }
        );
        response.cookies.delete('auth-token');

        return response;
    }
}
