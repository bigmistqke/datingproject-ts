import React from 'react';

import PlayActions from './PlayActions';
import GeneralActions from './GeneralActions';
import DesignActions from './DesignActions';
import SocketActions from './SocketActions';

import { createState, useState } from '@hookstate/core';

const application_state = createState({
  sound: undefined,
  autoswipe: false,
  connection: undefined,
  previous_game_id: undefined,
  received_instruction_ids: [],
  game_start: null,
  timers: {},
  clock_delta: undefined,
  mode: undefined,
  ids: {
    game: null,
    player: null,
    role: null,
    room: null
  },
  instruction_index: 0,
  instructions: null,
  _instructions: null,
  design: null,
  bools: {
    isInitialized: false,
  },
  viewport: {
    loading_percentage: false,
    timer: null,
    window_size: {
      width: null,
      height: null
    },
    card_size: {
      height: null,
      width: null
    },
  },
  stats: []
});

let actions = {};
Object.assign(actions, new SocketActions({ ref: application_state.value, state: application_state, actions }));
Object.assign(actions, new DesignActions({ ref: application_state.value, state: application_state, actions }));
Object.assign(actions, new PlayActions({ ref: application_state.value, state: application_state, actions }));
Object.assign(actions, new GeneralActions({ ref: application_state.value, state: application_state, actions }));

export function useStore(props) {
  const state = useState(application_state);
  return [state.value, actions];
}
