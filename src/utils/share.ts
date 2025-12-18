import { WhenGameState } from '../types';
import { getDailyTheme, getThemeDisplayName } from './dailyTheme';

const GAME_URL = 'https://www.play-when.com/';

/**
 * Generate emoji grid from placement history
 */
function generateEmojiGrid(placementHistory: boolean[]): string {
  return placementHistory.map(correct => correct ? '🟩' : '🟥').join('');
}

/**
 * Generate the share text based on game mode and results
 */
export function generateShareText(state: WhenGameState): string {
  const { gameMode, placementHistory, lastConfig, players, winners, turnNumber, roundNumber } = state;
  const emojiGrid = generateEmojiGrid(placementHistory);
  const playerCount = players.length;
  const correctCount = placementHistory.filter(p => p).length;
  const totalAttempts = placementHistory.length;

  let text = '';

  switch (gameMode) {
    case 'daily': {
      const dateStr = lastConfig?.dailySeed || new Date().toISOString().split('T')[0];
      const theme = getDailyTheme(dateStr);
      const themeName = getThemeDisplayName(theme);
      const won = winners.length > 0;
      text = `When #${dateStr} 📅\nTheme: ${themeName}\n${emojiGrid}\n${won ? '🏆 Won!' : `${correctCount}/${totalAttempts} correct`}`;
      break;
    }
    case 'suddenDeath': {
      if (playerCount > 1) {
        const winnerNames = winners.map(w => w.name).join(', ');
        text = `When ☠️ ${playerCount}P Sudden Death\n${winnerNames ? `🏆 Winner: ${winnerNames}` : 'No winner'}\nRounds: ${roundNumber}`;
      } else {
        text = `When ☠️ Sudden Death\n🔥 Streak: ${correctCount}\n${emojiGrid}`;
      }
      break;
    }
    case 'freeplay':
    default: {
      if (playerCount > 1) {
        const winnerNames = winners.map(w => w.name).join(', ');
        text = `When 🎯 ${playerCount} Players\n${winnerNames ? `🏆 Winners: ${winnerNames}` : 'No winner'}\nRounds: ${roundNumber} | Turns: ${turnNumber}`;
      } else {
        const won = winners.length > 0;
        text = `When 🎯 Freeplay\n${won ? '🏆 Won!' : `${correctCount}/${totalAttempts} correct`}\n${emojiGrid}`;
      }
      break;
    }
  }

  return `${text}\n\n${GAME_URL}`;
}

/**
 * Share content using Web Share API or fallback to clipboard
 * Returns true if copied to clipboard (toast should be shown)
 */
async function shareContent(text: string, title: string): Promise<boolean> {
  // Try native share first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return false; // Native share handled it, no toast needed
    } catch (err) {
      // User cancelled or share failed, fall through to clipboard
      if ((err as Error).name === 'AbortError') {
        return false; // User cancelled, no toast
      }
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return true; // Show toast
  } catch (err) {
    // Final fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true; // Show toast
  }
}

/**
 * Share game results using Web Share API or fallback to clipboard
 * Returns true if copied to clipboard (toast should be shown)
 */
export async function shareResults(state: WhenGameState): Promise<boolean> {
  const shareText = generateShareText(state);
  return shareContent(shareText, 'When - Timeline Game');
}

/**
 * Share the app (invite link) using Web Share API or fallback to clipboard
 * Returns true if copied to clipboard (toast should be shown)
 */
export async function shareApp(): Promise<boolean> {
  const text = `Try When - The Timeline Game!\n\n${GAME_URL}`;
  return shareContent(text, 'When - Timeline Game');
}
