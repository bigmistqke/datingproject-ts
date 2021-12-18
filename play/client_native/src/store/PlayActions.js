import MMKVStorage from "react-native-mmkv-storage";
const MMKV = new MMKVStorage.Loader().initialize();
import urls from "../urls";
import RNFS from "react-native-fs";
import { createMemo } from "react";
import isColor from "../helpers/isColor";



export default function PlayActions({ state, setState, actions, ref }) {
  console.log('playActions');
  let received_instruction_ids = []
  // init


  this.getInstructions = () => state.instructions;

  this.restartGame = async () => {
    let result = await this.joinRoom(state.ids.room);
    if (!result.success) {
      console.error("could not join room ", result);
      return;
    }
    const { instructions } = result;
    received_instruction_ids = [];
    actions.setInstructions(instructions);
    return;
  }

  // this.getPrevInstructionIds = (instruction_id) =>


  // state updates

  this.removeInstruction = (instruction) =>
    setState("instructions", instructions =>
      instructions.filter(i => {
        return i.instruction_id !== instruction.instruction_id
      }))

  this.removeFromPrevInstructionIds = (instruction_id) => {
    const start_time = performance.now();
    if (received_instruction_ids.indexOf(instruction_id) !== -1) return
    received_instruction_ids = [...received_instruction_ids, instruction_id];

    const first = performance.now();

    const instruction_index = state.instructions.findIndex(i =>
      i.prev_instruction_ids &&
      i.prev_instruction_ids.indexOf(instruction_id) !== -1
    )
    const second = performance.now();
    setState(
      "instructions",
      instruction_index,
      "prev_instruction_ids",
      prev_instruction_ids =>
        prev_instruction_ids.filter(prev_instruction_id =>
          prev_instruction_id !== instruction_id)
    )
    console.log('state update', first, second, performance.now());
  }

  this.swipe = (instruction) => {
    /* setTimeout(() => {
      
    }, 25)



    if (state.instructions.length === 1) {
      actions.sendFinished();
    } */
    if (instruction.next_role_ids) {
      instruction.next_role_ids.forEach(next_role_id => {

        if (next_role_id === state.ids.role) {
          this.removeFromPrevInstructionIds(instruction.instruction_id);
        }
        // actions.sendSwipe({ next_role_id, instruction_id: instruction.instruction_id });
      })
    }
    // this.removeInstruction(instruction)
    setTimeout(() => this.removeInstruction(instruction), 500)

    // only necessary for 'unsafe' debugging play-mode
    if (state.instructions.length > 1 && state.instructions[1].type === 'video') {
      console.error("video stop not implemented yet");
    }
  }
}