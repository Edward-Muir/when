import React from 'react';
import CustomGameSettings from '../CustomGameSettings';
import HintStrip from '../HintStrip';
import { tabHintText } from '../../utils/hintCopy';
import { useTabHint } from '../../hooks/useTabHint';

type CustomPanelProps = React.ComponentProps<typeof CustomGameSettings> & {
  /** Whether this panel is the visible pager tab (see `TimelinePanel`). */
  active: boolean;
};

/**
 * Custom tab: the page heading (in the same recipe as the Daily, Archive and Stats tabs),
 * the first-visit strip, and the filter controls. The settings state stays in `ModeSelect`,
 * which also builds the game from it; this panel is layout.
 */
const CustomPanel: React.FC<CustomPanelProps> = ({ active, ...settings }) => {
  const hint = useTabHint('customTab', active);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col flex-1 min-h-0 px-3">
      <div className="text-left mb-3">
        <h1 className="text-5xl font-bold text-text font-display leading-none">Custom</h1>
        <p className="text-text-muted text-sm mt-1 font-body">
          Choose your eras, categories & difficulty
        </p>
        <HintStrip text={hint.show ? tabHintText('customTab') : null} onDismiss={hint.dismiss} />
      </div>

      <CustomGameSettings {...settings} />
    </div>
  );
};

export default CustomPanel;
