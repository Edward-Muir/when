import React from 'react';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';

/**
 * The player's own name, live: it follows their current profile name, not the one stored with
 * today's score, so a rename in Profile shows at once on their own rows. Everyone else sees it
 * with the player's next score. The twin of `OwnPortrait`.
 */
const OwnName: React.FC = () => <>{usePlayerProfile().name}</>;

export default OwnName;
