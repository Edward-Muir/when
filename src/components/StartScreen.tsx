import React from 'react';
import { Clock, Play } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  isLoading?: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, isLoading = false }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream">
      <div className="bg-paper rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Logo */}
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
          <Clock className="w-12 h-12 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-sketch mb-2">When?</h1>
        <p className="text-sketch/60 text-lg mb-8">The Timeline Game</p>

        {/* Instructions */}
        <div className="bg-amber-50 rounded-xl p-4 mb-8 text-left">
          <h2 className="font-bold text-sketch mb-2">How to play:</h2>
          <ul className="text-sketch/70 text-sm space-y-2">
            <li>• You'll see one historical event at a time</li>
            <li>• Tap where you think it belongs on the timeline</li>
            <li>• Get points for correct placements</li>
            <li>• You have 8 turns to score as high as you can!</li>
          </ul>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          disabled={isLoading}
          className="
            w-full py-4 px-6
            bg-gradient-to-r from-amber-500 to-amber-600
            hover:from-amber-600 hover:to-amber-700
            disabled:from-gray-400 disabled:to-gray-500
            text-white text-lg font-medium
            rounded-xl shadow-lg
            transition-all duration-200
            flex items-center justify-center gap-2
            active:scale-95
            disabled:cursor-not-allowed
          "
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Game
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StartScreen;
