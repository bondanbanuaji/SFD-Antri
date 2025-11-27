'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('❌ [Error Boundary] Error caught:', error);
        console.error('❌ [Error Boundary] Component stack:', errorInfo.componentStack);

        // TODO: Send to error tracking service (Sentry, etc.)
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-gray-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-red-200 dark:border-red-900">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Terjadi Kesalahan
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Aplikasi mengalami masalah
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Maaf, terjadi kesalahan yang tidak terduga. Silakan refresh halaman atau hubungi administrator jika masalah berlanjut.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Detail Error (Development Only)
                                </summary>
                                <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Refresh Halaman
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Ke Beranda
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
    const throwError = (error: Error) => {
        throw error;
    };

    return { throwError };
}
