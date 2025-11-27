/**
 * Responsive Container Component
 * Auto-adjusts padding and max-width based on screen size
 */
export function ResponsiveContainer({
    children,
    className = ''
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl ${className}`}>
            {children}
        </div>
    );
}

/**
 * Responsive Grid Component
 * Auto-adjusts columns based on screen size
 */
export function ResponsiveGrid({
    children,
    cols = { mobile: 1, tablet: 2, desktop: 3 },
    gap = 6,
    className = ''
}: {
    children: React.ReactNode;
    cols?: { mobile?: number; tablet?: number; desktop?: number };
    gap?: number;
    className?: string;
}) {
    const gridCols = `grid-cols-${cols.mobile || 1} md:grid-cols-${cols.tablet || 2} lg:grid-cols-${cols.desktop || 3}`;
    return (
        <div className={`grid ${gridCols} gap-${gap} ${className}`}>
            {children}
        </div>
    );
}

/**
 * Responsive Card Component
 * Touch-friendly and adapts to screen size
 */
export function ResponsiveCard({
    children,
    className = '',
    onClick,
    hoverable = false
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}) {
    return (
        <div
            onClick={onClick}
            className={`
        rounded-lg border bg-card text-card-foreground shadow-sm
        p-4 sm:p-6
        ${onClick ? 'cursor-pointer' : ''}
        ${hoverable ? 'hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
}

/**
 * Responsive Button
 * Touch-friendly with proper tap targets (min 44x44px)
 */
export function ResponsiveButton({
    children,
    variant = 'default',
    size = 'default',
    fullWidth = false,
    className = '',
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg';
    fullWidth?: boolean;
}) {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50';

    const variantClasses = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
    };

    const sizeClasses = {
        sm: 'h-9 px-3 text-sm',
        default: 'h-11 px-4 py-2 sm:h-10 sm:px-4',
        lg: 'h-14 px-8 text-lg sm:h-12 sm:px-6',
    };

    return (
        <button
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * Mobile-friendly Navigation
 */
export function MobileNav({
    isOpen,
    onClose,
    children
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Menu */}
            <nav className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-background shadow-xl p-6 overflow-y-auto">
                {children}
            </nav>
        </div>
    );
}
