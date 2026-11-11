import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  /** On Home: sit above the tab bar and its home-indicator inset rather than at a fixed 80px. */
  aboveTabBar?: boolean;
}

export function Toast({
  message,
  isVisible,
  onClose,
  duration = 2000,
  aboveTabBar = false,
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed ${aboveTabBar ? 'bottom-above-tabbar' : 'bottom-20'} left-1/2 -translate-x-1/2 z-50`}
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-text text-bg rounded-lg shadow-lg">
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
