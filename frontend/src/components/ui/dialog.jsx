import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const DialogOverlay = ({ className, ...props }) => (
  <div
    className={cn(
      'fixed inset-0 z-50 bg-background/70 backdrop-blur-sm transition-opacity',
      className
    )}
    {...props}
  />
);

export const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <DialogOverlay onClick={() => onOpenChange?.(false)} />
        {children}
      </div>
    ) : null,
    document.body
  );
};

export const DialogContent = ({ className, children }) => {
  const handleContentClick = (event) => {
    // Empêcher la fermeture du dialog quand on clique à l'intérieur
    event.stopPropagation();
  };

  return (
    <div
      onClick={handleContentClick}
      className={cn(
        'relative z-50 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
};

export const DialogHeader = ({ className, ...props }) => (
  <div className={cn('space-y-1 text-left', className)} {...props} />
);

export const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
);

export const DialogDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);

export const DialogFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
