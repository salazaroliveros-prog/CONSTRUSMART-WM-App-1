import React from 'react';

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
  stagger?: boolean;
  /** Animation type for children */
  animation?: 'stagger-fade' | 'fade-in-up' | 'scale-in' | 'bounce-in';
  /** Base delay in ms before first child animates */
  baseDelay?: number;
  /** Delay increment between each child in ms */
  staggerDelay?: number;
}

/**
 * AnimatedContainer: Aplica animaciones de entrada escalonadas (stagger)
 * a sus hijos directos. Cada hijo recibe `animate-stagger-fade` con un delay progresivo.
 * 
 * Uso: <AnimatedContainer><div>1</div><div>2</div><div>3</div></AnimatedContainer>
 * → 3 divs animados en secuencia.
 */
const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  className = '',
  as: Tag = 'div',
  stagger = true,
  animation = 'stagger-fade',
  baseDelay = 0,
  staggerDelay = 80,
}) => {
  const childrenArray = React.Children.toArray(children);
  const total = childrenArray.length;

  return (
    <Tag className={className}>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        const delay = baseDelay + i * staggerDelay;
        const delayClass = delay <= 400 ? `stagger-${Math.round(delay / 50)}` : '';
        const animClass = `animate-${animation} ${delayClass}`;
        const existingClassName = child.props.className || '';
        return React.cloneElement(child, {
          className: `${existingClassName} ${stagger ? animClass : ''}`.trim(),
          style: delay > 400 ? { ...(child.props.style || {}), animationDelay: `${delay}ms` } : child.props.style,
        } as React.HTMLAttributes<HTMLElement>);
      })}
    </Tag>
  );
};

export default React.memo(AnimatedContainer);