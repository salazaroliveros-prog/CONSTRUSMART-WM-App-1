import React, { memo, lazy, Suspense } from 'react';

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  showHome?: boolean;
  header?: boolean;
}

const LazyHeader = lazy(() => import('./Header'));

const PageShell: React.FC<PageShellProps> = ({ children, title, showHome = true, header = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {header && (
        <Suspense fallback={null}>
          <LazyHeader showHome={showHome} title={title} />
        </Suspense>
      )}
      <main className="flex-1 w-full max-w-full mx-auto px-3 sm:px-5 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default memo(PageShell);
