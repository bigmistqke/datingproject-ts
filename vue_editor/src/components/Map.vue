<template>
	<div
		className="map-container"
		onContextMenu="createBlock()"
		@mousedown="nav"
	>
		<div
			:className="`map ${connecting ? 'connecting' : ''}`"
			:style="`transform: translateX(${store.state.navigation.origin.x}px) translateY(${store.state.navigation.origin.y}px) `"
		>
			<div
				className="zoom"
				:style="`transform: scale(${store.state.navigation.zoom})`"
			>
				<Block
					v-for="block in allBlocks"
					:key="block.block_id"
					:block="block"
				></Block>
			</div>
		</div>
	</div>
</template>

<script>
import Block from "./Block.vue";
import { mapGetters, mapActions, useStore } from "vuex";
import drag from "@/drag.js";

export default {
	props: ["script_id"],
	components: {
		Block,
	},
	methods: { ...mapActions(["fetchScript"]) },
	computed: { ...mapGetters(["allBlocks"]) },
	created() {
		console.log("created", this, this.script_id);
		this.fetchScript({ script_id: this.script_id });
	},
	setup() {
		const store = useStore();

		console.log("store", store);

		const processNavigation = () => {};
		const createBlock = () => {};
		let connecting = false;
		let origin = { x: 0, y: 100 };

		let nav = (e) => {
			if (!e.target.classList.contains("map-container")) return;
			let _drag = drag(e);
			_drag.on("update", (e) => {
				store.dispatch("addToOrigin", { delta: e });
			});
		};

		return { processNavigation, createBlock, connecting, origin, nav, store };
	},
};
</script>

<style>
.map {
	transform: translateX(0px) translateY(0px);
}
.map-container {
	/* height: 100vh; */
	width: 100vw;
	flex: 1;
	background: var(--dark);
}
</style>