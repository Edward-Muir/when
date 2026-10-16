import React from 'react';
import Portrait, { PortraitProps } from './Portrait';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';

/**
 * The player's own portrait, live: it follows their current pick, not the one stored with
 * today's score, so a pick made after submitting shows at once on their own screen.
 */
const OwnPortrait: React.FC<Omit<PortraitProps, 'animal'>> = (props) => {
  const { avatar } = usePlayerProfile();
  return <Portrait animal={avatar} {...props} />;
};

export default OwnPortrait;
