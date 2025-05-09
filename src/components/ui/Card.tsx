import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  footer?: React.ReactNode;
  bordered?: boolean;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  footer,
  bordered = true,
  hoverable = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg overflow-hidden';
  const borderClass = bordered ? 'border border-gray-200' : '';
  const hoverClass = hoverable ? 'transition-shadow hover:shadow-lg' : '';
  
  return (
    <div 
      className={`${baseClasses} ${borderClass} ${hoverClass} ${className}`}
      {...props}
    >
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {footer && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 