export default function PlayActions({ state, setState, actions, ref }) {
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



  // state updates

  this.removeInstruction = (instruction_id) =>
    setState("instructions", instructions =>
      instructions.filter(i => i.instruction_id !== instruction_id))

  this.removeFromPrevInstructionIds = (instruction_id) => {
    const start_time = performance.now();
    if (received_instruction_ids.indexOf(instruction_id) !== -1) return
    received_instruction_ids = [...received_instruction_ids, instruction_id];

    const instruction_index = state.instructions.findIndex(i =>
      i.prev_instruction_ids &&
      i.prev_instruction_ids.indexOf(instruction_id) !== -1
    )
    setState(
      "instructions",
      instruction_index,
      "prev_instruction_ids",
      prev_instruction_ids =>
        prev_instruction_ids.filter(prev_instruction_id =>
          prev_instruction_id !== instruction_id)
    )
    console.log('changing this state: ', performance.now() - start_time);
  }

  this.swipe = (instruction) => {
    setTimeout(() => {
      if (instruction.next_role_ids) {
        instruction.next_role_ids.forEach(next_role_id => {

          if (next_role_id === state.ids.role) {
            this.removeFromPrevInstructionIds(instruction.instruction_id);
          }
          // actions.sendSwipe({ next_role_id, instruction_id: instruction.instruction_id });
        })
      }
    }, 125)



    if (state.instructions.length === 1) {
      actions.sendFinished();
    }
    setTimeout(() => {
      this.removeInstruction(instruction.instruction_id);
    }, 50);

    // only necessary for 'unsafe' debugging play-mode
    if (state.instructions.length > 1 && state.instructions[1].type === 'video') {
      console.error("video stop not implemented yet");
    }
  }
}