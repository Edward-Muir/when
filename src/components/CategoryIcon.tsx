import React from 'react';
import { Category } from '../types';

interface CategoryIconProps {
  category: Category;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className = '' }) => {
  const iconClass = `w-12 h-12 sm:w-16 sm:h-16 opacity-30 ${className}`;

  switch (category) {
    case 'conflict':
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="currentColor">
          <path d="M12 4l6 6-2 2 20 20 2-2 6 6-4 4-6-6 2-2-20-20-2 2-6-6 4-4z" />
          <path d="M52 4l-6 6 2 2-20 20-2-2-6 6 4 4 6-6-2-2 20-20 2 2 6-6-4-4z" />
          <rect x="8" y="52" width="12" height="4" rx="1" transform="rotate(-45 14 54)" />
          <rect x="44" y="52" width="12" height="4" rx="1" transform="rotate(45 50 54)" />
        </svg>
      );

    case 'disasters':
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="currentColor">
          <path d="M32 4c0 0-16 20-16 36 0 10 7 18 16 18s16-8 16-18c0-16-16-36-16-36zm0 48c-6 0-10-5-10-12 0-8 6-18 10-24 4 6 10 16 10 24 0 7-4 12-10 12z" />
          <path d="M32 36c0 0-6 8-6 14 0 4 3 6 6 6s6-2 6-6c0-6-6-14-6-14z" opacity="0.5" />
        </svg>
      );

    case 'exploration':
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="currentColor">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="32" cy="32" r="3" />
          <polygon points="32,8 35,28 32,32 29,28" />
          <polygon points="32,56 29,36 32,32 35,36" opacity="0.5" />
          <polygon points="8,32 28,29 32,32 28,35" opacity="0.5" />
          <polygon points="56,32 36,35 32,32 36,29" />
        </svg>
      );

    case 'cultural':
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="currentColor">
          <path d="M8 16c0-4 14-8 20-8s12 4 12 8c0 16-8 28-16 28S8 32 8 16z" />
          <circle cx="16" cy="20" r="3" fill="white" opacity="0.8" />
          <circle cx="28" cy="20" r="3" fill="white" opacity="0.8" />
          <path d="M14 30c4 4 12 4 16 0" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
          <path d="M36 24c0-4 14-8 20-8s4 4 4 8c0 16-4 28-12 28s-12-12-12-28z" opacity="0.7" />
          <circle cx="44" cy="28" r="3" fill="white" opacity="0.6" />
          <circle cx="52" cy="28" r="3" fill="white" opacity="0.6" />
          <path d="M44 38c2-3 8-3 10 0" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
        </svg>
      );

    case 'infrastructure':
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="currentColor">
          <rect x="20" y="24" width="24" height="36" />
          <polygon points="32,4 8,24 56,24" />
          <rect x="28" y="44" width="8" height="16" fill="white" opacity="0.3" />
          <rect x="24" y="28" width="6" height="8" fill="white" opacity="0.3" />
          <rect x="34" y="28" width="6" height="8" fill="white" opacity="0.3" />
          <rect x="10" y="20" width="4" height="40" />
          <rect x="50" y="20" width="4" height="40" />
        </svg>
      );

    case 'diplomatic':
      return (
        <svg className={iconClass} viewBox="0 0 64 64" fill="currentColor">
          <path d="M16 8c-4 0-8 4-8 8v4h8V8z" />
          <path d="M16 8h32v40c0 4-4 8-8 8H16c-4 0-8-4-8-8V20h8V8z" />
          <path d="M48 8c4 0 8 4 8 8v4h-8V8z" opacity="0.7" />
          <rect x="20" y="18" width="20" height="2" fill="white" opacity="0.4" />
          <rect x="20" y="24" width="20" height="2" fill="white" opacity="0.4" />
          <rect x="20" y="30" width="16" height="2" fill="white" opacity="0.4" />
          <rect x="20" y="36" width="20" height="2" fill="white" opacity="0.4" />
          <circle cx="32" cy="48" r="4" fill="white" opacity="0.3" />
        </svg>
      );

    default:
      return null;
  }
};

export default CategoryIcon;
