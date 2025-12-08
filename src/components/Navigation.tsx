import { Link, useLocation } from 'react-router-dom';
import { Cloud, Settings, ArrowRight } from 'lucide-react';

export function Navigation() {
  const location = useLocation();

  const scrollToPlanner = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Cloud className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">What2Wear</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                location.pathname === '/'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Planner
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-2 font-medium transition-colors ${
                location.pathname === '/settings'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>

            {location.pathname === '/' && (
              <button
                onClick={scrollToPlanner}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                Start Planning
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
