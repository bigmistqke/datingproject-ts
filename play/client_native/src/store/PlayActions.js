import MMKVStorage from "react-native-mmkv-storage";
const MMKV = new MMKVStorage.Loader().initialize();
import urls from "../urls";
import RNFS from "react-native-fs";
import { createMemo } from "react";
import isColor from "../helpers/isColor";



export default function PlayActions({ state, ref, actions }) {
  let received_instruction_ids = []
  // init

  this.restartGame = async () => {
    try {
      let result = await this.joinRoom(ref.ids.room);
      if (!result.success)
        throw ["could not join room ", result]

      const { instructions } = result;
      received_instruction_ids = [];
      actions.setInstructions(instructions);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  this.updateTimer = (instruction_id, timer) => state.timers[instruction_id].set(timer)

  /*   this.removeInstruction = (instruction) => {
      state.instructions.set(instructions => instructions.filter(i => {
        return i.instruction_id !== instruction.instruction_id
      }))
    } */

  this.removeFromPrevInstructionIds = (instruction_id) => {
    const start_time = performance.now();
    if (received_instruction_ids.indexOf(instruction_id) !== -1) return
    received_instruction_ids = [...received_instruction_ids, instruction_id];

    const first = performance.now();

    const instruction_index = ref.instructions.findIndex(i =>
      i.prev_instruction_ids &&
      i.prev_instruction_ids.indexOf(instruction_id) !== -1
    )
    const second = performance.now();


    state.instructions[instruction_index].prev_instruction_ids
      .set(prev_instruction_ids =>
        prev_instruction_ids.filter(prev_instruction_id =>
          prev_instruction_id !== instruction_id
        )
      )
    if (ref.instructions[instruction_index].prev_instruction_ids.length === 0) {
      console.log("NO MORE PREV_INSTRUCTION_IDS!!!");
    }
  }

  this.swipeAway = (index) => {
    console.log("SWIPE AWAY");

    console.log(ref.instructions[index]);

    state.instructions[index].swiped.set(true)
    // i.swiped.set(true)
  };

  this.swipe = (instruction) => {
    try {
      /* setTimeout(() => {
            
          }, 25)
      
      
      
          if (ref.instructions.length === 1) {
            actions.sendFinished();
          } */
      if (!instruction) {
        throw "INSTRUCTION IS UNDEFINED"
      }
      const next_role_ids = instruction.next_role_ids ? [...instruction.next_role_ids] : false;
      const instruction_id = instruction.instruction_id;
      // this.removeInstruction(instruction);
      setTimeout(() => {
        state.instruction_index.set(i => {
          return i + 1;
        })
      }, 250)

      console.log("INSTRUCTION_INDEX IS ", ref.instruction_index);

      if (next_role_ids) {

        next_role_ids.forEach(next_role_id => {

          if (next_role_id === ref.ids.role) {
            this.removeFromPrevInstructionIds(instruction_id);
          }
          actions.sendSwipe({ next_role_id, instruction_id: instruction.instruction_id });
        })
      }

      // this.removeInstruction(instruction)

      // this.removeInstruction(instruction)
      /*     setTimeout(() => {
            this.removeInstruction(instruction);
            console.log("state is ");
            console.log(JSON.stringify(ref));
          }, 250) */


      // only necessary for 'unsafe' debugging play-mode
      /* if (ref.instructions.length > 1 && ref.instructions[1].type === 'video') {
        console.error("video stop not implemented yet");
      } */

    } catch (err) {
      console.error("ERROR WHILE SWIPING ", err);
    }
  }
}