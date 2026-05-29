import React, { useRef, useState } from 'react';
import { GripVertical, Maximize2, Minimize2, X } from 'lucide-react';

export interface ChartCardProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Tailwind col-span classes e.g. "col-span-12 lg:col-span-6" */
  span?: string;
  /** Optional fixed height e.g. "h-48" or "min-h-[180px]" */
  height?: string;
  /** Called when user drops this card */
  onDrop?: (id: string, targetId: string) => void;
  /** Toggle expand/collapse */
  onToggleExpand?: (id: string) => void;
  /** Remove chart from view */
  onRemove?: (id: string) => void;
  /** Enable/disable drag */
  draggable?: boolean;
  /** Animation delay ms */
  delay?: number;
  /** Extra className */
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  id, title, icon, children, span = 'col-span-12', height = 'min-h-[200px] sm:min-h-[250px]',
  onDrop, onToggleExpand, onRemove, draggable = true, delay, className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.dataTransfer.setData('chart-id', id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50', 'scale-95');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50', 'scale-95');
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    setIsDragOver(false);
    const sourceId = e.dataTransfer.getData('chart-id');
    if (sourceId && sourceId !== id) {
      onDrop?.(sourceId, id);
    }
  };

  const effectiveSpan = isExpanded ? 'col-span-12' : span;

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        ${effectiveSpan} ${isExpanded ? 'row-span-2' : ''} ${height}
        bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden
        flex flex-col transition-all duration-300 ease-out
        ${isDragOver ? 'ring-2 ring-primary/50 shadow-lg scale-[1.01] bg-accent/20' : ''}
      `}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20 shrink-0 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          {draggable && <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />}
          {icon && <span className="shrink-0">{icon}</span>}
          <h3 className="font-bold text-xs text-card-foreground truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onToggleExpand && (
            <button
              onClick={() => { setIsExpanded(e => !e); onToggleExpand(id); }}
              className="p-1 rounded hover:bg-accent transition text-muted-foreground"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 transition text-muted-foreground hover:text-red-500"
              title="Ocultar gráfica"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default React.memo(ChartCard);