import uniqid from "uniqid";

class InstructionManager {
    constructor({ script_id, getInstructions, updateInstructions, getBlocks, getRoles, updateBlocks }) {
        this.ext = { getInstructions, updateInstructions, getBlocks, updateBlocks, getRoles, script_id }
    }
    getDefaultInstruction = (block_id, role_id) => {
        return { block_id: block_id, script_id: this.ext.script_id, role_id: role_id, type: "say", text: "" }
    }



    add = ({ block_id, prev_instruction_id, role_id }) => {
        let new_instr = this.getDefaultInstruction(block_id, role_id);
        let instruction_id = uniqid();
        let t_instructions = this.ext.getInstructions();
        t_instructions[instruction_id] = new_instr;
        this.ext.updateInstructions(t_instructions);

        let t_blocks = this.ext.getBlocks();

        let b_instr = t_blocks.find(v => v.block_id === block_id).instructions;
        let b_instr_i = b_instr.findIndex((v) => v === prev_instruction_id);
        console.log(b_instr_i, b_instr, prev_instruction_id);

        b_instr.splice((b_instr_i + 1), 0, instruction_id);
        this.ext.updateBlocks(t_blocks);
    }

    remove = (block_id, instruction_id) => {
        console.log(instruction_id);

        let t_blocks = this.ext.getBlocks();

        let b_instr = t_blocks.find(v => v.block_id === block_id).instructions;
        let b_instr_i = b_instr.findIndex((v) => v === instruction_id);
        b_instr.splice(b_instr_i, 1);
        this.ext.updateBlocks(t_blocks);

        let t_instructions = this.ext.getInstructions();
        delete t_instructions[instruction_id];
        this.ext.updateInstructions(t_instructions);


    };

    change = (instruction_id, data) => {
        let t_instructions = this.ext.getInstructions();
        let t_instruction = t_instructions[instruction_id];
        Object.keys(data).forEach((key) => {
            t_instruction[key] = data[key];
        })

        this.ext.updateInstructions(t_instructions);
    }

    uploadVideo = async (file, instruction_id) => {
        console.log(file, instruction_id);
        return new Promise((resolve) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('instruction_id', instruction_id);
            formData.append('script_id', this.ext.script_id);

            fetch(`${window._url.fetch}/api/uploadVideo`, {
                method: 'POST',
                body: formData,
                processData: false,
                contentType: false
            }).then(response => response.json())
                .then(url => {
                    resolve({ success: true, url: url });
                })
                .catch(error => {
                    resolve({ success: false, error: error });

                })
        })
    }


}

export default InstructionManager