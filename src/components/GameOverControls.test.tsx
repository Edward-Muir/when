import React from 'react';
import { render, screen } from '@testing-library/react';
import GameOverControls from './GameOverControls';
import { WhenGameState } from '../types';

const state = (gameMode: WhenGameState['gameMode']) =>
  ({ gameMode, placementHistory: [], players: [] }) as unknown as WhenGameState;

const renderBar = (gameMode: WhenGameState['gameMode'], visible?: boolean) =>
  render(
    <GameOverControls
      state={state(gameMode)}
      onRestart={jest.fn()}
      onNewGame={jest.fn()}
      onShowToast={jest.fn()}
      visible={visible}
    />
  );

describe('GameOverControls', () => {
  it('offers Share, Restart and Home once the end-of-game screens are gone', () => {
    renderBar('suddenDeath');
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Share',
      'Restart',
      'Home',
    ]);
  });

  it('has no Restart on a Daily', () => {
    renderBar('daily');
    expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
  });

  it('hides every button while a popup or a step is up', () => {
    renderBar('suddenDeath', false);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
