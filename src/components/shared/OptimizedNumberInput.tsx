import React, { useMemo } from 'react';

/**
 * OptimizedNumberInput - Evita parpadeo (flickering) en inputs numéricos
 * al memoizar el componente y usar callbacks estables.
 * 
 * PROBLEMA: Los onChange inline crean nuevas funciones en cada render,
 * causando que el input se recree innecesariamente.
 * 
 * SOLUCIÓN: Este componente memoriza el valor y solo re-renderiza
 * cuando el valor real cambia.
 */

interface OptimizedNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  tabIndex?: number;
  title?: string;
}

/**
 * Componente base que recibe el callback ya memoizado
 */
const NumberInputBase = React.forwardRef<HTMLInputElement, OptimizedNumberInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      className = 'w-full px-1.5 py-1 text-xs border rounded',
      min,
      max,
      step = 'any',
      disabled = false,
      tabIndex,
      title,
    },
    ref
  ) => {
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = parseFloat(e.target.value) || 0;
        onChange(numValue);
      },
      [onChange]
    );

    return (
      <input
        ref={ref}
        type="number"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        tabIndex={tabIndex}
        title={title}
      />
    );
  }
);

NumberInputBase.displayName = 'NumberInputBase';

/**
 * Componente memoizado para prevenir re-renders innecesarios
 */
export const OptimizedNumberInput = React.memo(NumberInputBase, (prevProps, nextProps) => {
  // Retorna true si los props son iguales (NO re-render)
  // Retorna false si hay cambios (SÍ re-render)
  
  const isEqual = 
    prevProps.value === nextProps.value &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.className === nextProps.className &&
    prevProps.min === nextProps.min &&
    prevProps.max === nextProps.max &&
    prevProps.step === nextProps.step &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.tabIndex === nextProps.tabIndex &&
    prevProps.title === nextProps.title;

  return isEqual;
});

OptimizedNumberInput.displayName = 'OptimizedNumberInput';
