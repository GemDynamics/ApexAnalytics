import React, { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  risiko?: 'rot' | 'gelb' | 'grün';
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  risiko,
  className = '',
  ...props
}) => {
  // Wenn ein Risiko angegeben ist, verwende die entsprechende Variante
  if (risiko) {
    variant = risiko === 'rot' ? 'danger' : 
              risiko === 'gelb' ? 'warning' : 
              risiko === 'grün' ? 'success' : 'default';
  }
  
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-indigo-100 text-indigo-800',
  };

  // Zeige ein Symbol für rot, gelb, grün
  const risikoIcon = risiko && (
    <span className="mr-1">
      {risiko === 'rot' ? '🔴' : risiko === 'gelb' ? '🟡' : '🟢'}
    </span>
  );
  
  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {risikoIcon}
      {risiko ? (risiko.charAt(0).toUpperCase() + risiko.slice(1)) : children}
    </span>
  );
};

export default Badge; 