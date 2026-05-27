import React, { useEffect, useRef } from 'react';

const DevDiagnostics: React.FC = () => {
  const obsRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        console.log('[DevDiag] focusin:', target.tagName, target.getAttribute('name') || target.getAttribute('id') || target.className || target);
      }
    };

    const onFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        console.log('[DevDiag] focusout:', target.tagName, target.getAttribute('name') || target.getAttribute('id') || target.className || target);
      }
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    // MutationObserver to detect removals of focused elements
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.removedNodes.forEach((n) => {
            if (n instanceof HTMLElement) {
              const inputs = n.querySelectorAll && typeof n.querySelectorAll === 'function' ? n.querySelectorAll('input, textarea, [contenteditable]') : [];
              if (inputs && inputs.length) {
                console.warn('[DevDiag] removed node contained inputs/textareas:', n);
              }
            }
          });
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    obsRef.current = observer;

    console.log('[DevDiag] initialized');

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      if (obsRef.current) obsRef.current.disconnect();
    };
  }, []);

  return null;
};

export default React.memo(DevDiagnostics);
