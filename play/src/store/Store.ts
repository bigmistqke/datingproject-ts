import RNFS from 'react-native-fs';
import urls from '../urls';

import { Image } from 'react-native';

import NetInfo from '@react-native-community/netinfo';

import { createState, useState } from '@hookstate/core';
import TypedMqtt from '../utils/TypedMqtt';

import MMKVStorage from 'react-native-mmkv-storage';
import Sound from 'react-native-sound';
import { VideoInstruction } from '../../../types';
import postData from '../utils/postData';
import { array_remove_element } from '../utils/pure-array';
import { Actions, Progress, State } from './types';

const socket = new TypedMqtt<{
  '/monitor/*/*/restart/confirmation': { success: true };
  '/monitor/*/*/forcedSwipe/confirmation': { success: true };
  '/*/*/status':
    | {
        status: 'connected';
      }
    | {
        status: 'finished';
        game_id: string;
      };
  '/*/*/confirmation': {
    instruction_id: string;
    role_id: string;
  };
  '/*/*/instruction_index': {
    instruction_index: number;
  };
  '/*/*/swipe': {
    instruction_id: string;
    role_id: string;
    timestamp: number;
  };
  '/*/*/ping': {
    timestamp: number;
  };
  '/*/*/restart': {};
  '/*/*/forcedSwipe': {};
  '/*/*/autoswipe': {
    autoswipe: boolean;
  };
}>();

const MMKV = new MMKVStorage.Loader().initialize();

let progresses: Record<string, Progress> = {};

const application_state = createState<State>({
  sound: undefined,
  game_start: 0,
  autoswipe: false,
  connection: undefined,
  previous_game_id: undefined,
  received_instruction_ids: [],
  timers: {},
  clock_delta: undefined,
  mode: undefined,
  ids: {
    game: undefined,
    player: undefined,
    role: undefined,
    room: undefined,
  },
  instruction_index: 0,
  instructions: [],
  _instructions: '',
  design: undefined,
  bools: {
    isInitialized: false,
  },
  viewport: {
    loading_percentage: undefined,
    timer: null,
    window_size: {
      width: 0,
      height: 0,
    },
    card_size: {
      height: 0,
      width: 0,
    },
  },
  stats: [],
});

let unconfirmed_messages: string[] = [];

const actions: Actions = {
  // SOCKET

  disconnectSocket: () => socket.disconnect(),
  reconnectSocket: () => socket.reconnect(),
  getNow: () => new Date().getTime() + (application_state.value.clock_delta ?? 0),
  initSocket: async () => {
    try {
      await socket.connect({ url: urls.socket, port: 443 });
      actions.ping();
      return true;
    } catch (err) {
      console.error('ERROR AT initSocket', err);
      return false;
    }
  },
  initSubscriptions: ({ room_id, role_id }) => {
    socket.subscribe(`/${room_id}/${role_id}/restart` as const, () => {
      actions.restartGame();
      unconfirmed_messages = [];
      socket.send(`/monitor/${room_id}/${role_id}/restart/confirmation` as const, {
        success: true,
      });
    });
    socket.subscribe(`/${room_id}/${role_id}/forcedSwipe` as const, () => {
      actions.swipeAway(application_state.value.instruction_index);
      actions.swipe(
        application_state.value.instructions[application_state.value.instruction_index],
      );
      socket.send(`/monitor/${room_id}/${role_id}/forcedSwipe/confirmation` as const, {
        success: true,
      });
    });

    socket.subscribe(`/${room_id}/${role_id}/swipe` as const, message => {
      const { instruction_id, role_id: sender_role_id, timestamp } = message;
      const delta = actions.getNow() - timestamp;

      // SEND CONFIRMATION-MESSAGE BACK TO SENDER THAT WE RECEIVED THIS MESSAGE
      setTimeout(() => actions.sendConfirmation({ role_id: sender_role_id, instruction_id }), 50);
      if (sender_role_id === application_state.value.ids.role) return;
      actions.removeFromPrevInstructionIds(instruction_id, delta);
    });

    socket.subscribe(`/${room_id}/${role_id}/confirmation` as const, message => {
      const { instruction_id, role_id: received_role_id } = message;
      const message_id = `${received_role_id}_${instruction_id}`;
      unconfirmed_messages = array_remove_element(unconfirmed_messages, message_id);
    });

    socket.subscribe(`/${room_id}/${role_id}/autoswipe` as const, ({ autoswipe }) => {
      application_state.autoswipe.set(autoswipe);
    });

    socket.send(`/${room_id}/${role_id}/status` as const, {
      status: 'connected',
    });
  },

  removeSubscriptions: ({ room_id, role_id }) => {
    socket.unsubscribe(`/${room_id}/${role_id}/restart` as const);
    socket.unsubscribe(`/${room_id}/${role_id}/forcedSwipe` as const);
    socket.unsubscribe(`/${room_id}/${role_id}/swipe` as const);
    socket.unsubscribe(`/${room_id}/${role_id}/confirmation` as const);
    socket.unsubscribe(`/${room_id}/${role_id}/autoswipe` as const);
    socket.unsubscribe(`/${room_id}/${role_id}/restart` as const);
    socket.unsubscribe(`/${room_id}/${role_id}/status` as const);
  },

  sendConfirmation: ({ role_id, instruction_id }) => {
    socket.send(`/${application_state.value.ids.room}/${role_id}/confirmation` as const, {
      instruction_id,
      role_id: application_state.value.ids.role,
    });
  },

  sendInstructionIndex: () => {
    socket.send(
      `/${application_state.value.ids.room}/${application_state.value.ids.role}/instruction_index` as const,
      {
        instruction_index: application_state.value.instruction_index,
      },
    );
  },
  sendSwipe: ({ next_role_id, instruction_id }) => {
    try {
      const swipe_id = `${next_role_id}_${instruction_id}`;
      socket.send(`/${application_state.value.ids.room}/${next_role_id}/swipe` as const, {
        role_id: application_state.value.ids.role,
        instruction_id,
        timestamp: actions.getNow(),
      });

      if (next_role_id == application_state.value.ids.role) return;
      if (unconfirmed_messages.indexOf(swipe_id) === -1) unconfirmed_messages.push(swipe_id);

      setTimeout(() => {
        if (unconfirmed_messages.indexOf(swipe_id) === -1) return;
        actions.sendSwipe({ next_role_id, instruction_id });
      }, 500);
    } catch (err) {
      console.error('ERROR SEND SWIPE ', err);
    }
  },
  sendFinished: () =>
    socket.send(`/${actions.thisPath()}/status` as const, {
      status: 'finished',
      game_id: application_state.value.ids.game,
    }),

  ping: () => {
    socket.send(
      `/${application_state.value.ids.room}/${application_state.value.ids.role}/ping` as const,
      {
        timestamp: actions.getNow(),
      },
    );
    setTimeout(() => actions.ping(), 2000);
  },

  calculateClockDelta: async () => {
    const start = new Date().getTime();

    const result = await fetch(`${urls.fetch}/api/getServerTime`);
    const now = new Date().getTime();

    if (!result || result.status !== 200) return false;

    const { timestamp } = await result.json();

    const clock_delta = Math.floor(timestamp - (start + now) / 2);

    return clock_delta;
  },

  syncClock: async () => {
    const clock_deltas: number[] = [];

    await actions.calculateClockDelta();
    for (let i = 0; i < 20; i++) {
      const delta = await actions.calculateClockDelta();
      if (!delta) {
        return;
      }
      clock_deltas.push(delta);
    }

    const clock_delta = clock_deltas.reduce((a, b) => a + b) / clock_deltas.length;

    application_state.clock_delta.set(clock_delta);
  },

  // DESIGN
  convert: (value: number) =>
    Math.floor(
      (Math.floor(value) * (application_state.value.viewport.card_size.height ?? 0)) / 300,
    ),

  getBorderRadius: () => Math.floor(application_state.value.design?.border_radius ?? 0),

  updateCardSize: () => {
    if (
      application_state.value.design &&
      application_state.value.viewport.window_size.height /
        application_state.value.viewport.window_size.width >
        application_state.value.design.card_dimensions.height /
          application_state.value.design.card_dimensions.width
    ) {
      application_state.viewport.card_size.set({
        height:
          (application_state.value.viewport.window_size.width *
            0.9 *
            application_state.value.design.card_dimensions.height) /
          application_state.value.design.card_dimensions.width,
        width: application_state.value.viewport.window_size.width * 0.9,
      });
    } else {
      application_state.viewport.card_size.set({
        height: application_state.value.viewport.window_size.height * 0.9,
        width:
          (application_state.value.viewport.window_size.height *
            0.9 *
            application_state.value.design.card_dimensions.width) /
          application_state.value.design.card_dimensions.height,
      });
    }
  },

  isElementVisible: ({ element, modes }) => {
    try {
      if (!modes) return true;

      for (const [mode_type, activated] of Object.entries(modes)) {
        if (!(mode_type in element.modes)) {
          throw [`element does not have mode ${mode_type}`, element];
        }
        if (element.modes[mode_type] !== 1 && element.modes[mode_type] !== (activated ? 2 : 0)) {
          return false;
        }
      }
      return true;
    } catch (err) {
      return false;
    }
  },

  getStyles: ({ element, highlight, masked }) =>
    element[highlight ? 'highlight_styles' : 'styles']?.[masked ? 'masked' : 'normal'],

  getTextStyles: ({ element, masked }) => {
    const styles = actions.getStyles({ element, masked });

    return {
      fontSize: actions.convert(styles.size),
      fontFamily: styles.family,
      justifyContent: actions.convertAlignmentToJustify(styles.alignment),
      color: styles.color,
      textShadowColor: styles.shadowColor,
    };
  },

  convertAlignmentToJustify: alignment => {
    switch (alignment) {
      case 'right':
        return 'flex-end';
      case 'center':
        return 'center';
      case 'left':
        return 'flex-start';
      default:
        return alignment;
    }
  },

  getHighlightStyles: ({ element, masked }) => {
    const styles = actions.getStyles({ element, highlight: true, masked });

    return {
      ...actions.getTextStyles({ element, masked }),
      fontFamily: styles.family,
      color: styles.color,
      backgroundColor: styles.background,
      justifyContent: actions.convertAlignmentToJustify(styles.alignment),
      paddingLeft: actions.convert(styles.paddingHorizontal),
      paddingRight: actions.convert(styles.paddingHorizontal),
      paddingTop: actions.convert(styles.paddingVertical),
      paddingBottom: actions.convert(styles.paddingVertical),
      marginLeft: actions.convert(styles.marginHorizontal),
      marginRight: actions.convert(styles.marginHorizontal),
      marginTop: actions.convert(styles.marginVertical),
      marginBottom: actions.convert(styles.marginVertical),
      borderRadius: actions.convert(styles.borderRadius),
    };
  },

  // PLAY

  restartGame: async () => {
    try {
      actions.setInstructions(JSON.parse(application_state.value._instructions));
      application_state.instruction_index.set(0);
      application_state.timers.set({});
      application_state.received_instruction_ids.set([]);
      if (application_state.value.stats.play_times.length > 0) actions.sendStats();
      actions.initStats();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  startTimer: (instruction_id, timespan) => {
    const start = performance.now();
    let countdown = timespan;
    application_state.timers[instruction_id].set(timespan);

    const tick = () => {
      if (!application_state.value.timers[instruction_id]) return;
      const new_time = Math.max(0, timespan - (performance.now() - start) / 1000);
      countdown--;
      if (Math.abs(new_time - countdown) > 1) {
        countdown = Math.ceil(new_time);
      }
      if (countdown >= 0) setTimeout(tick, 1000);
      application_state.timers[instruction_id].set(countdown);
    };
    setTimeout(tick, 500);
  },

  updateTimer: (instruction_id, timer) => application_state.timers[instruction_id].set(timer),

  removeInstruction: instruction => {
    application_state.instructions.set(instructions =>
      instructions.filter(i => {
        return i.instruction_id !== instruction.instruction_id;
      }),
    );
  },

  removeFromPrevInstructionIds: (instruction_id, delta) => {
    if (application_state.value.received_instruction_ids.indexOf(instruction_id) !== -1) return;
    application_state.received_instruction_ids.set([
      ...application_state.value.received_instruction_ids,
      instruction_id,
    ]);

    const instruction_index = application_state.value.instructions.findIndex(
      i => i.prev_instruction_ids && i.prev_instruction_ids.indexOf(instruction_id) !== -1,
    );

    application_state.instructions[instruction_index].prev_instruction_ids.set(
      prev_instruction_ids =>
        prev_instruction_ids.filter(prev_instruction_id => prev_instruction_id !== instruction_id),
    );

    if (
      application_state.value.instructions[instruction_index].prev_instruction_ids.length === 0 &&
      instruction_index === application_state.value.instruction_index
    ) {
      application_state.instructions[instruction_index].delta.set(delta);
    }
  },

  swipeAway: index => application_state.instructions[index].swiped.set(true),

  swipe: instruction => {
    try {
      actions.addToStats('swipe', instruction);

      if (application_state.value.timers[instruction.instruction_id]) {
        application_state.timers[instruction.instruction_id].set(undefined);
      }

      if (!instruction) {
        throw 'INSTRUCTION IS UNDEFINED';
      }
      const next_role_ids = instruction.next_role_ids ? [...instruction.next_role_ids] : false;
      const instruction_id = instruction.instruction_id;

      if (next_role_ids) {
        next_role_ids.forEach(next_role_id => {
          if (next_role_id === application_state.value.ids.role) {
            actions.removeFromPrevInstructionIds(instruction_id);
          }
          actions.sendSwipe({
            next_role_id,
            instruction_id: instruction.instruction_id,
          });
        });
      }

      setTimeout(() => {
        application_state.instruction_index.set(i => i + 1);

        if (
          application_state.value.instruction_index >= application_state.value.instructions.length
        )
          actions.sendStats();

        actions.sendInstructionIndex();
      }, 0);
    } catch (err) {
      console.error('ERROR WHILE SWIPING ', err);
    }
  },

  // GENERAL

  setInstructions: instructions => application_state.instructions.set(instructions),
  setIds: ids => application_state.ids.set(ids),
  setDesign: design => application_state.design.set(design),

  setWindowSize: ({ width, height }) =>
    application_state.viewport.window_size.set({ width, height }),

  initNetInfo: () => {
    NetInfo.addEventListener(connection => {
      if (connection.type === 'none') {
        // alert("device offline");
      } else {
        if (application_state.value.connection === 'none') {
          actions.reconnectSocket();
        }
      }

      application_state.connection.set(connection.type);
    });
  },

  setMode: mode => {
    application_state.mode.set(mode);
  },
  initGame: async (game_id, ignore_cache = false) => {
    try {
      actions.setMode('load');
      // actions.setInstructions([]);
      application_state.timers.set({});
      await MMKV.setStringAsync('game_id', game_id);
      application_state.received_instruction_ids.set([]);

      const {
        instructions,
        _instructions,
        role_id,
        room_id,
        player_id,
        design,
        design_id,
        instruction_index,
        sound,
        autoswipe,
        success,
      } = await actions.joinRoom(game_id);

      if (!success) {
        throw 'joinRoom did not succeed ';
      }

      if (!instructions) {
        throw 'INSTRUCTIONS IS NULL';
      }

      application_state.game_start.set(new Date().getTime());
      application_state.autoswipe.set(autoswipe);

      actions.setDesign(design);
      actions.updateCardSize(design);

      actions.setIds({
        player: player_id,
        role: role_id,
        room: room_id,
        game: game_id,
      });

      if (!application_state.value.bools.isInitialized) await actions.initSocket();

      actions.initSubscriptions({ role_id, room_id });

      // IMPORTANT: both downloadVideos mutate instructions (sets url to local file-path)!
      await Promise.all([
        actions.downloadVideos(instructions, ignore_cache),
        actions.downloadDesignElements({ design, design_id, ignore_cache }),
        actions.downloadSound(sound),
      ]);

      progresses = {};
      application_state.viewport.loading_percentage.set(undefined);
      application_state.instructions.set(instructions);
      application_state._instructions.set(JSON.stringify(_instructions));
      application_state.instruction_index.set(instruction_index);
      application_state.bools.isInitialized.set(true);

      actions.setMode('play');

      actions.initStats();

      return true;
    } catch (err) {
      console.error('ERROR WHILE INITIGAME', err);
      application_state.viewport.loading_error.set(err);
      setTimeout(() => {
        actions.setMode('new');
      }, 3000);
      return false;
    }
  },

  checkCachedGameId: async () => {
    const previous_game_id = (await MMKV.getStringAsync('game_id')) ?? undefined;
    application_state.previous_game_id.set(previous_game_id);
    return previous_game_id;
  },

  getPreviousGameId: () => application_state.value.previous_game_id,

  joinRoom: async game_id => {
    try {
      const result = await fetch(`${urls.fetch}/api/room/join/${game_id}`).catch(err =>
        console.error(err),
      );
      if (!result) {
        return {
          success: false,
          error: 'could not fetch instructions: double check the url',
        };
      }
      return await result.json();
    } catch (err) {
      return { success: false, error: 'ERROR while joining room:', err };
    }
  },

  preloadDesignElements: async design => {
    const base_url = RNFS.DocumentDirectoryPath + '/designs';

    const svgs = Object.values(design.types)
      .map(type => type.filter(element => element.type === 'svg'))
      .reduce((a, b) => a.concat(b));
    for (const svg of svgs) {
      const filename = `${svg.id}_normal.png`;
      await Image.getSize(filename, () => {});
      filename = `${svg.id}_masked.png`;
      await Image.getSize(filename, () => {});
    }
  },

  downloadSound: async filename => {
    try {
      const base_url = RNFS.DocumentDirectoryPath + '/sounds';
      if (!(await RNFS.exists(base_url))) await RNFS.mkdir(base_url);

      await RNFS.downloadFile({
        fromUrl: `${urls.fetch}/api/sounds/${filename}?${new Date().getTime()}`,
        toFile: `${base_url}/${filename}`,
      }).promise;

      var ping = new Sound(filename, base_url, error => {
        if (error) throw error;
        ping.setVolume(0);
        ping.play(success => {
          if (!success) return;
          application_state.sound.set(ping);
          ping.setVolume(1);
        });
      });

      return true;
    } catch (error) {
      console.error('error while downloading sound', error);
      return false;
    }
  },

  downloadWithProgress: ({ from_path, to_path, modified, ignore_cache }) =>
    new Promise<boolean>(async resolve => {
      if (await RNFS.exists(to_path)) {
        const stat = await RNFS.stat(to_path);
        if (!ignore_cache && modified && new Date(stat.mtime).getTime() > modified) {
          resolve(true);
          return;
        }
      }

      RNFS.downloadFile({
        fromUrl: from_path,
        toFile: to_path,
        progress: e => {
          progresses[to_path] = [e.bytesWritten, e.contentLength];
          actions.updateProgress();
        },
      }).promise.then(result => {
        resolve(result.statusCode === 200);
      });
    }),

  downloadDesignElements: async ({ design, design_id, ignore_cache }) => {
    try {
      const base_url = RNFS.DocumentDirectoryPath + '/designs';

      if (!(await RNFS.exists(base_url))) await RNFS.mkdir(base_url);

      const svgs = Object.values(design.types)
        .map(type => type.filter(element => element.type === 'svg'))
        .reduce((a, b) => a.concat(b));

      const promises = [];

      for (const svg of svgs) {
        promises.push(
          actions.downloadWithProgress({
            from_path: `${urls.fetch}/api/designs/${design_id}/${
              svg.id
            }_normal.png?${new Date().getTime()}`,
            to_path: `${base_url}/${svg.id}_normal.png`,
            modified: design.modified,
            ignore_cache,
          }),
        );
        promises.push(
          actions.downloadWithProgress({
            from_path: `${urls.fetch}/api/designs/${design_id}/${
              svg.id
            }_masked.png?${new Date().getTime()}`,
            to_path: `${base_url}/${svg.id}_masked.png`,
            modified: design.modified,
            ignore_cache,
          }),
        );
      }
      const result = await Promise.all(promises);
      return !result.find(bool => !bool);
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  updateProgress: () => {
    const total_progress = Object.values(progresses)
      .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
      .reduce((a, b) => (a / b) * 100);
    application_state.viewport.loading_percentage.set(total_progress);
  },

  downloadVideos: async (instructions, ignore_cache) => {
    const base_url = RNFS.DocumentDirectoryPath + '/videos';

    const downloadVideo = (video: VideoInstruction) =>
      new Promise<boolean>(async resolve => {
        try {
          const filename = video.text.split('/')[video.text.split('/').length - 1];

          const to_path = `${base_url}/${filename}`;

          if (await RNFS.exists(to_path)) {
            const stat = await RNFS.stat(to_path);

            if (
              !ignore_cache &&
              Math.floor(video.filesize) === stat.size &&
              (!video.modified || new Date(stat.mtime).getTime() > video.modified)
            ) {
              resolve(true);
              return;
            }
          }

          const video_response = await RNFS.downloadFile({
            fromUrl: `${urls.fetch}${video.text}`,
            toFile: `${base_url}/${filename}`,
            progress: e => {
              progresses[filename] = [e.bytesWritten, e.contentLength];
              actions.updateProgress();
            },
          }).promise;

          if (video_response.statusCode !== 200) {
            // Or something else, basically a check for failed responses
            throw `error while downloading ${filename}: statusCode ${video_response.statusCode}`;
          } else if (
            video.filesize &&
            Math.floor(video_response.bytesWritten) !== Math.floor(video.filesize)
          ) {
            // Or something else, basically a check for failed responses
            throw `error while downloading ${filename}: response.bytesWritten !== video.filesize ${video_response.bytesWritten} ${video.filesize}`;
          } else {
            resolve(true);
          }
        } catch (err) {
          console.error('video-error', err);
          if (await downloadVideo(video)) resolve(true);
          resolve(false);
        }
      });

    try {
      if (!(await RNFS.exists(RNFS.DocumentDirectoryPath + '/videos'))) {
        RNFS.mkdir(base_url);
      }

      const videos = instructions.filter(
        instruction => instruction.type === 'video',
      ) as VideoInstruction[];
      const promises = videos.map(video => downloadVideo(video));
      return Promise.all(promises);
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  initStats: async () => {
    application_state.stats.set([]);
  },

  addToStats: (type, instruction) => {
    application_state.stats.set(history => [
      ...history,
      {
        time: actions.getNow(),
        type,
        instruction,
      },
    ]);
  },

  sendStats: async () => {
    const res = await postData(
      `${urls.fetch}/api/room/stats/save/${application_state.value.ids.room}/${application_state.value.ids.role}`,
      {
        ...application_state.value.stats,
      },
    );

    actions.initStats();

    if (!res) console.error('error while posting stats to server');
  },

  endGame: () => {
    actions.setMode('new');
    actions.removeSubscriptions({
      role_id: application_state.value.ids.role,
      room_id: application_state.value.ids.room,
    });
  },
};

export function useStore() {
  const state = useState(application_state);
  return [state.value, actions] as const;
}
