import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-[#0b141a] text-center p-6 select-none">
      <div className="p-4 bg-rose-100 dark:bg-rose-950/50 rounded-full mb-4 text-rose-600 dark:text-rose-400">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">404 - Page Not Found</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
        The route you are trying to access does not exist or has been moved.
      </p>
      <Link
        to="/chat"
        className="mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 text-sm"
      >
        <Home className="w-4 h-4" /> Back to Application
      </Link>
    </div>
  );
};
