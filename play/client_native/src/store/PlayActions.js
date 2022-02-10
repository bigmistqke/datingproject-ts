import { log, error } from "../helpers/log";
import BackgroundTimer from 'react-native-background-timer';


export default function PlayActions({ state, ref, actions }) {
  // let received_instruction_ids = []
  // init



  this.restartGame = async () => {
    try {
      actions.setInstructions(JSON.parse(ref._instructions));
      state.instruction_index.set(0);
      state.timers.set({});
      state.received_instruction_ids.set([]);
      // state.rerender.set(performance.now());
      return true;
    } catch (err) {
      error(err);
      return false;
    }
  }


  this.startTimer = (instruction_id, timespan) => {
    let start = new Date().getTime();
    let initial_time_out = setInterval(() => {
      state.timers[instruction_id].set(parseInt(timespan - (new Date().getTime() - start) / 1000));
    })

    let timeout_id = BackgroundTimer.setInterval(() => {
      clearInterval(initial_time_out);
      state.timers[instruction_id].set(parseInt(timespan - (new Date().getTime() - start) / 1000));
    }, 1000);

    setTimeout(() => {
      BackgroundTimer.clearInterval(timeout_id)
    }, timespan * 1000)
  }

  this.updateTimer = (instruction_id, timer) => state.timers[instruction_id].set(timer)

  this.removeInstruction = (instruction) => {
    state.instructions.set(instructions => instructions.filter(i => {
      return i.instruction_id !== instruction.instruction_id
    }))
  }

  this.removeFromPrevInstructionIds = (instruction_id, delta) => {

    if (ref.received_instruction_ids.indexOf(instruction_id) !== -1) return
    state.received_instruction_ids.set([...ref.received_instruction_ids, instruction_id])
    // state.received_instruction_ids.set(array => array.push(instruction_id))
    // received_instruction_ids = [...received_instruction_ids, instruction_id];
    const instruction_index = ref.instructions.findIndex(i =>
      i.prev_instruction_ids &&
      i.prev_instruction_ids.indexOf(instruction_id) !== -1
    )

    state.instructions[instruction_index].prev_instruction_ids
      .set(prev_instruction_ids => (
        prev_instruction_ids.filter(prev_instruction_id =>
          prev_instruction_id !== instruction_id
        )
      ))

    if (
      ref.instructions[instruction_index].prev_instruction_ids.length === 0
      && instruction_index === ref.instruction_index
    ) {
      state.instructions[instruction_index].delta.set(delta)
    }
  }

  this.swipeAway = (index) => state.instructions[index].swiped.set(true)


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
      // 
      if (next_role_ids) {
        next_role_ids.forEach(next_role_id => {
          if (next_role_id === ref.ids.role) {
            this.removeFromPrevInstructionIds(instruction_id);
          }
          actions.sendSwipe({ next_role_id, instruction_id: instruction.instruction_id });
        })
      }
      // 

      setTimeout(() => {
        state.instruction_index.set(i => i + 1);
        actions.sendInstructionIndex();
      }, 0)

      // this.removeInstruction(instruction)

      // this.removeInstruction(instruction)
      /*     setTimeout(() => {
            this.removeInstruction(instruction);
             
             
          }, 250) */


      // only necessary for 'unsafe' debugging play-mode
      /* if (ref.instructions.length > 1 && ref.instructions[1].type === 'video') {
        error("video stop not implemented yet");
      } */

    } catch (err) {
      error("ERROR WHILE SWIPING ", err);
    }
  }
}