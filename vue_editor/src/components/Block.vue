<template>
	<div
		:id="`block_${block.block_id}`"
		class="block_container"
		ref="block_DOM"
		@mousedown="startPosition"
		@contextmenu="contextMenu"
		:style="`transform: translate(${block.position.x}px, ${block.position.y}px)`"
	>
		<div className="block">
			<BlockRoles
				:block="block"
				direction="in"
			/>
			<div className="instructions">
				<Instruction
					v-for="instruction of allInstructionsOfBlock(block)"
					:key="instruction.instruction_id"
					:instruction="instruction"
				/>
			</div>
			<BlockRoles
				:block="block"
				direction="out"
			/>
		</div>
	</div>
</template>

<script>
import Instruction from "./Instruction.vue";
import BlockRoles from "./BlockRoles.vue";
import { mapGetters, mapActions, useStore } from "vuex";
import drag from "@/drag.js";
import { ref } from "@vue/reactivity";

export default {
	components: { Instruction, BlockRoles },
	props: ["block"],
	computed: { ...mapGetters(["allInstructionsOfBlock"]) },
	setup(props) {
		const store = useStore();
		let block_DOM = ref();

		const startPosition = (e) => {
			if (e.target.id !== block_DOM.value.id) return;
			e.preventDefault();
			e.stopPropagation();

			let _drag = drag(e);
			_drag.on("update", (delta) => {
				store.dispatch("moveBlock", {
					block: props.block,
					delta,
				});
			});
		};

		const contextMenu = (e) => {
			e.preventDefault();
			e.stopPropagation();
		};
		return { ...props, startPosition, contextMenu, block_DOM };
	},
};
</script>

<style scoped>
.block_container {
	position: absolute;
	padding: 25px;
	background: #ffffff42;
	cursor: grab;
	border-radius: 45px;
}

.block {
	background: grey;
	width: 900px;
	border-radius: 17px;
}

.block.connecting > div {
	pointer-events: none;
}
</style>