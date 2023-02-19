import { Design as _Design, DesignElement, Instruction } from '../../../types';
type Design = _Design['production'];

/* type TextStyle = {
  family: string;
  color: string;
  background: string;
  justifyContent: string;
  paddingHorizontal: string;
  paddingHorizontal: string;
  paddingVertical: string;
  paddingBottom: string;
  marginLeft: string;
  marginRight: string;
  marginTop: string;
  marginBottom: string;
  borderRadius: string;
}; */

type Style = {
  family: string;
  size: number;
  alignment: string;
  color: string;
  shadowColor: string;
  background: string;
  paddingHorizontal: number;
  paddingVertical: number;
  marginHorizontal: number;
  marginVertical: number;
  borderRadius: number;
};

type TextStyle = {
  fontSize: number;
  fontFamily: string;
  justifyContent: string;
  color: string;
  textShadowColor: string;
};

export type Progress = number[];

export type State = {
  sound?: Sound;
  autoswipe: boolean;
  game_start: number;
  connection?: unknown;
  previous_game_id?: string;
  received_instruction_ids: string[];
  game_start?: undefined;
  timers: Record<string, any>;
  clock_delta?: number;
  mode?: 'new' | 'play' | 'load';
  ids: {
    game?: string;
    player?: string;
    role?: string;
    room?: string;
  };
  instruction_index: number;
  instructions: Instruction[];
  _instructions: string;
  design?: Design;
  bools: {
    isInitialized: boolean;
  };
  viewport: {
    loading_percentage?: number;
    loading_error?: unknown;
    timer?: unknown;
    window_size: {
      width: number;
      height: number;
    };
    card_size: {
      height: number;
      width: number;
    };
  };
  stats: Stats;
};

type RoomResponse =
  | {
      success: true;
      instructions: Instruction[];
      _instructions: Instruction[];
      role_id: string;
      room_id: string;
      player_id: string;
      design: Design;
      design_id: string;
      instruction_index: number;
      sound: string;
      autoswipe: boolean;
    }
  | {
      success: false;
      instructions?: undefined;
      _instructions?: undefined;
      role_id?: undefined;
      room_id?: undefined;
      player_id?: undefined;
      design?: undefined;
      design_id?: undefined;
      instruction_index?: undefined;
      sound?: undefined;
      autoswipe?: undefined;
    };

export type Actions = {
  // SOCKET

  disconnectSocket: () => void;
  reconnectSocket: () => void;
  getNow: () => number;
  initSocket: () => Promise<boolean>;
  initSubscriptions: ({ room_id, role_id }: { room_id: string; role_id: string }) => void;
  removeSubscriptions: ({
    room_id,
    role_id,
  }: {
    room_id: string | undefined;
    role_id: string | undefined;
  }) => void;
  sendConfirmation: ({
    role_id,
    instruction_id,
  }: {
    role_id: string;
    instruction_id: string;
  }) => void;
  sendInstructionIndex: () => void;
  sendSwipe: ({
    next_role_id,
    instruction_id,
  }: {
    next_role_id: string;
    instruction_id: string;
  }) => void;
  sendFinished: () => void;
  ping: () => void;
  calculateClockDelta: () => Promise<number | false>;
  syncClock: () => Promise<void>;

  // DESIGN
  convert: (value: number) => number;
  getBorderRadius: () => number;
  updateCardSize: () => void;
  isElementVisible: ({
    element,
    modes,
  }: {
    element: DesignElement;
    modes: {
      timed: boolean;
      choice: boolean;
    };
  }) => boolean;
  getStyles: ({
    element,
    highlight,
    masked,
  }: {
    element: DesignElement;
    masked: DesignElement;
    highlight?: boolean;
  }) => Style;
  getTextStyles: ({
    element,
    masked,
  }: {
    element: DesignElement;
    masked: DesignElement;
  }) => TextStyle;
  convertAlignmentToJustify: <T extends string>(
    alignment: T,
  ) => 'flex-end' | 'center' | 'flex-start' | T;
  getHighlightStyles: ({
    element,
    masked,
  }: {
    element: DesignElement;
    masked: DesignElement;
  }) => void;

  // PLAY

  restartGame: () => Promise<boolean>;
  startTimer: (instruction_id: string, timespan: number) => void;
  updateTimer: (instruction_id: string, timer: Timer) => void;
  removeInstruction: (instruction: Instruction) => void;
  removeFromPrevInstructionIds: (instruction_id: string, delta?: number) => void;
  swipeAway: (index: number) => void;
  swipe: (instruction: Instruction) => void;

  // GENERAL

  setInstructions: (instructions: Instruction[]) => void;
  setIds: (ids: State['ids']) => void;
  setDesign: (design: Design) => void;
  setWindowSize: ({ width, height }: { width: number; height: number }) => void;
  initNetInfo: () => void;
  setMode: (mode: State['mode']) => void;
  initGame: (game_id: string, ignore_cache = false) => Promise<boolean>;
  checkCachedGameId: () => Promise<string | undefined | null>;
  getPreviousGameId: () => string | undefined;
  joinRoom: (game_id: string) => Promise<RoomResponse>;
  preloadDesignElements: (design: Design) => Promise<void>;
  downloadSound: (filename: string) => Promise<boolean>;
  downloadWithProgress: ({
    from_path,
    to_path,
    modified,
    ignore_cache,
  }: {
    from_path: string;
    to_path: string;
    modified: number;
    ignore_cache: boolean;
  }) => Promise<boolean>;
  downloadDesignElements: ({
    design,
    design_id,
    ignore_cache,
  }: {
    design: Design;
    design_id: string;
    ignore_cache: boolean;
  }) => Promise<boolean>;
  updateProgress: () => void;
  downloadVideos: (instructions: Instruction[], ignore_cache: boolean) => Promise<videos[], false>;
  initStats: () => Promise<void>;
  addToStats: (type, instruction) => void;
  sendStats: () => Promise<void>;
  endGame: () => void;
};
