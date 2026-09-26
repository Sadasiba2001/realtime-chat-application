import React from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import appLogo from '../../assets/logo.png';

export const MobileUnsupportedScreen: React.FC = () => {
  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center px-6 py-10 bg-canvas dark:bg-g-bg text-center select-none overflow-y-auto">
      <img src={appLogo} alt="SB Chat" className="w-10 h-10 object-contain mb-10" />

      <div className="relative mb-8" aria-hidden="true">
        <div className="w-28 h-28 rounded-full bg-accent-soft dark:bg-gold/12 flex items-center justify-center">
          <Smartphone className="w-12 h-12 text-accent dark:text-gold stroke-[1.5]" />
        </div>
        <div className="absolute -bottom-1 -right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-surface dark:bg-g-bg2 border border-line dark:border-g-line shadow-softer text-ink-2 dark:text-g-text2 dark:shadow-none">
          <Monitor className="w-3.5 h-3.5" />
          <Tablet className="w-3.5 h-3.5" />
        </div>
      </div>

      <h1 className="text-xl font-semibold text-ink dark:text-g-text max-w-xs leading-snug">
        This web application is designed for desktop and tablet.
      </h1>
      <p className="mt-3 text-sm text-ink-2 dark:text-g-text2 max-w-xs leading-relaxed">
        For mobile, please use our mobile app.
      </p>

      <p className="mt-10 text-xs text-ink-3 dark:text-g-text3">
        Open this page on a screen at least 768px wide to continue.
      </p>
    </main>
  );
};
