import uniqid from "uniqid";

class InstructionManager {
    constructor({ script_id, getNodes, getRoles, updateNodes }) {
        this.ext = { getNodes, updateNodes, getRoles, script_id }
    }
    getDefaultInstruction = (node_id, role_id) => {
        return { instruction_id: uniqid(), node_id: node_id, script_id: this.ext.script_id, role_id: role_id, type: "say", text: "" }
    }

    add = ({ node_id, instruction_id, role_id }) => {
        let t_nodes = this.ext.getNodes();
        let t_instructions = t_nodes.find(v => v.node_id === node_id).instructions;
        let instruction_index = t_instructions.findIndex((v) => v.instruction_id === instruction_id);
        let newNode = this.getDefaultInstruction(node_id, role_id);
        t_instructions.splice((instruction_index + 1), 0, newNode);
        console.log("ADD ", t_nodes);
        this.ext.updateNodes(t_nodes);
    }

    remove = (node_id, instruction_id) => {
        let t_nodes = this.ext.getNodes();
        let t_instructions = t_nodes.find(v => v.node_id === node_id).instructions.filter(function (value) { return value.instruction_id != instruction_id });
        t_nodes.find(v => v.node_id === node_id).instructions = t_instructions;
        this.ext.updateNodes(t_nodes);
    };

    change = (node_id, instruction_id, data) => {
        let t_nodes = this.ext.getNodes();
        let t_instruction = t_nodes.find(v => v.node_id === node_id).instructions.find(v => v.instruction_id === instruction_id);

        Object.keys(data).forEach((key) => {
            t_instruction[key] = data[key];
        })

        this.ext.updateNodes(t_nodes);
    }
}

export default InstructionManager