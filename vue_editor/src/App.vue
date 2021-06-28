<template>
	<router-view />
</template>

<style>
:root {
	--bg-color: #aee9b1;
	--txt-color: #0a4297;
	--b-radius: 7.5vh;
	--border: 1px solid lightgrey;
	--r-height: 35px;
	--dark: #e3e3e3;
	--medium: #f2f2f2;
	--light: #fafafa;
	--dark-shadow: 0px 0px 25px #99999944;
	--light-shadow: 0px 0px 50px #ffffff4f;
}

body {
	padding: 0px;
	margin: 0px;
	height: 100vh;
	width: 100vw;
	overflow: hidden;
	font-family: arial;
}
#app {
	display: flex;
	height: 100%;
	width: 100%;
	flex-direction: column;
}
</style>
