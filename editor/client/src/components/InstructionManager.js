import uniqid from "uniqid";

function InstructionManager({ _get, _set, script_id }) {

    const getDefaultInstruction = (block_id, role_id) => {
        return { block_id: block_id, script_id: script_id, role_id: role_id, type: "say", text: "" }
    }

    this.add = ({ block_id, prev_instruction_id, role_id }) => {
        let new_instr = getDefaultInstruction(block_id, role_id);
        let instruction_id = uniqid();
        let t_instructions = _get.instructions();
        t_instructions[instruction_id] = new_instr;
        _set.instructions(t_instructions);

        let t_blocks = _get.blocks();
        let b_instr = t_blocks.find(v => v.block_id === block_id).instructions;
        let b_instr_i = b_instr.findIndex((v) => v === prev_instruction_id);
        b_instr.splice((b_instr_i + 1), 0, instruction_id);
        _set.blocks(t_blocks);
    }

    this.remove = (block_id, instruction_id) => {
        let t_blocks = _get.blocks();
        let b_instr = t_blocks.find(v => v.block_id === block_id).instructions;
        let b_instr_i = b_instr.findIndex((v) => v === instruction_id);
        b_instr.splice(b_instr_i, 1);
        _set.blocks(t_blocks);

        let t_instructions = _get.instructions();
        delete t_instructions[instruction_id];
        _set.instructions(t_instructions);
    };

    this.change = (instruction_id, data) => {
        let t_instructions = _get.instructions();
        let t_instruction = t_instructions[instruction_id];
        Object.keys(data).forEach((key) => {
            t_instruction[key] = data[key];
        })

        _set.instructions(t_instructions);
    }

    this.uploadVideo = async (file, instruction_id) => {
        console.log(file, instruction_id);
        return new Promise((resolve) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('instruction_id', instruction_id);
            formData.append('script_id', script_id);

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