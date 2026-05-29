import React from 'react';
import { cn } from '@/lib/utils';

interface Loader3DProps {
  size?: number;
  className?: string;
  text?: string;
}

const Loader3D: React.FC<Loader3DProps> = ({ size = 70, className, text }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className="loader-circle-11"
        style={{ width: size, height: size }}
      >
        <div className="arc arc-1" />
        <div className="arc arc-2" />
        <div className="arc arc-3" />
      </div>
      {text && (
        <p className="text-xs font-medium text-white/70 animate-pulse-soft">{text}</p>
      )}
    </div>
  );
};

export default React.memo(Loader3D);