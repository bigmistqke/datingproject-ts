<template>
	<div class="instruction">
		<div className="instruction-order tiny">{{instruction.index}}</div>
		<select
			:value="instruction.role"
			onChange="changeRole"
			className="instruction-role"
		>
			<option
				v-for="connection in instruction.connections"
				:key="connection.role_id"
				:value="connection.role_id"
			>
				{{connection.role_id}}
			</option>
		</select>
		<select
			:value="instruction.type"
			:onChange="changeType"
			className="instruction-type"
		>
			<option value="do">action</option>
			<option value="say">speech</option>
			<option value="think">thought</option>
			<option value="video">video</option>
		</select>

		<div className="instruction-timer">
			<input
				type='number'
				@change="changeTimespan"
				min="0"
				step="5"
				precision="0"
				:value="instruction.timespan ? instruction.timespan : 0"
				:class="!instruction.timespan ? 'gray' : null"
			/>
		</div>
		<div :class="`timer-sound ${sound ? 'on' : '' }`">
			<label> 🕪 </label>
			<input
				type='checkbox'
				@change="changeSound"
				:checked="instruction.sound"
			/>
		</div>
		<template v-if="instruction.type === 'video'">
			<video
				v-if="instruction.text != ''"
				className='instruction-text'
				:src="getFetchURL + instruction.text"
			></video>
			<input
				v-else
				type="file"
				@change="processVideo"
				class="instruction-text"
			/>
		</template>
		<input
			v-else
			type="text"
			placeholder="enter instruction here"
			@change="changeText"
			className="instruction-text"
		/>

		<button
			className="instruction-button tiny"
			@click="removeRow"
		>-</button>
		<button
			className="instruction-button tiny"
			@click="addRow"
		>+</button>
	</div>

</template>

<script>
import { mapGetters, mapActions, useStore } from "vuex";

export default {
	props: ["instruction"],
	computed: { ...mapGetters(["getFetchURL"]) },
	setup(props) {
		const store = useStore();

		console.log("store", store.getters.getFetchURL);

		const changeRole = (e) => {};
		const changeType = (e) => {};
		const changeTimespan = (e) => {};
		const changeText = (e) => {};
		const processVideo = (e) => {};

		return { changeRole, changeType, changeTimespan, changeText, processVideo };
	},
};
</script>

<style>
video {
	height: 150px;
}

.instruction {
	transition: background 0.5s;
	display: flex;
	flex-direction: row;
}

.instruction.error {
	border: none;
	background: #ffc6c6;
}

.instruction > *:not(.instruction-text) {
	color: darkgrey;
}

.instruction-text {
	flex: 1;
}

.instruction-text {
	font-size: 12pt;
	padding-left: 20px;
}

.instruction-role,
.instruction-timer {
	flex: 0 0 40px !important;
}
.instruction-timer input {
	height: 100%;
	width: 100%;
	box-sizing: border-box;
}

.timer-sound {
	flex: 0 50px !important;
	align-self: center;
	display: flex;
	align-items: center;
}

.timer-sound label {
	flex: 1;
	text-align: center;
	color: lightgrey;
}

.timer-sound.on label {
	color: black;
}
</style>