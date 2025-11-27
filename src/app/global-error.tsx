'use client';

export const dynamic = 'error';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    minHeight: '100vh',
                    fontFamily: 'system-ui, sans-serif',
                    padding: '20px'
                }}>
                    <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>Something went wrong!</h1>
                    <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
                        {error.message || 'An unexpected error occurred'}
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            backgroundColor: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
