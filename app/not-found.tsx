import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="text-4xl font-extrabold text-primary">404</div>
      <h2 className="text-lg font-bold text-foreground">Page Not Found</h2>
      <p className="text-xs text-muted-foreground max-w-sm">
        The execution screen you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
      >
        <Home className="h-4 w-4" />
        <span>Return to Today</span>
      </Link>
    </div>
  );
}
