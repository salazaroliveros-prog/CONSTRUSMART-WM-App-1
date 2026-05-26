import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  showHome?: boolean;
  header?: boolean;
}

const PageShell: React.FC<PageShellProps> = ({ children, title, showHome = true, header = true }) => {
  const HeaderComponent = React.lazy(() => import('./Header'));

  return (
    <div className="min-h-screen flex flex-col bg-background animate-fadeIn">
      {header && (
        <React.Suspense fallback={null}>
          <HeaderComponent showHome={showHome} title={title} />
        </React.Suspense>
      )}
      <main className="flex-1 w-full mx-auto animate-fade-in-up">
        {children}
      </main>
    </div>
  );
};

export default PageShell;
