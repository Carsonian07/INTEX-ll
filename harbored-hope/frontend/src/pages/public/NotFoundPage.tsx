import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-xs font-semibold text-hh-gold uppercase tracking-widest mb-4">404</p>
      <h1 className="font-serif text-4xl font-medium text-hh-navy dark:text-white mb-4">
        Page not found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-8 leading-relaxed">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="bg-hh-navy text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-hh-navy-dark transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
