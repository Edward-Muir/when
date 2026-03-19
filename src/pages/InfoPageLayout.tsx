import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface InfoPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ title, children }) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen-safe flex flex-col bg-bg">
      <div className="fixed top-0 left-0 right-0 z-50 bg-bg pt-safe border-b border-border transition-colors">
        <div className="flex items-center gap-3 p-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-surface border border-border hover:bg-border transition-colors active:scale-95"
            aria-label="Back to app"
          >
            <ArrowLeft className="w-5 h-5 text-text" />
          </button>
          <h1 className="text-xl font-display font-semibold text-text">{title}</h1>
        </div>
      </div>

      <div className="flex-1 pt-[60px] overflow-y-auto pb-safe">
        <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
      </div>
    </div>
  );
};

export default InfoPageLayout;
