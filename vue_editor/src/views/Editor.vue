<template>
	<header className="row absolute flex">
		<h1 className="flexing">editor for script {script_id}</h1>
		<label>roles</label>
		<input type="number" />

		<button
			@click="test"
			className="Instruction-button"
		>test</button>
		<button
			onClick="{test}"
			className="Instruction-button"
		>
			active games
		</button>
		<button
			onClick="{save}"
			ref="{r_saveButton}"
			className="Instruction-button"
		>
			save
		</button>
	</header>
	<Map :script_id="script_id"></Map>
</template>

<script>
import { useRoute } from "vue-router";
import Map from "@/components/Map.vue";
import { onMounted } from "@vue/runtime-core";
// import { ref } from "vue";

export default {
	components: {
		Map,
	},
	setup() {
		const route = useRoute();
		const script_id = route.params.script_id;
		return { script_id };
	},
};
</script>

<style scoped>
header {
	top: 0px;
	display: flex;
	width: 100%;
	font-size: 10pt;
	font-weight: 300;
	z-index: 1;

	line-height: var(--r-height);
	min-height: var(--r-height);
	margin: auto;
	overflow: hidden;
	/* border-bottom: var(--border); */
	background: #e3e3e3;
	cursor: default;
}

h1 {
	flex: 1;
	font-size: 10pt;
	font-weight: 300;
	text-align: left;
	margin: 0px;
	padding: 0px;
	margin-left: 25px;
}
</style>