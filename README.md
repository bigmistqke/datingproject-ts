# datingproject

`The Dating Project` is an art-project I was involved with from 2019-2022. `The Dating Project` is a collaborative performance which uses smartphones to give instructions. A team was responsible for writing the scenarios and I was responsible for the tech. During my time with the project I steered the project from a very lo-fi art-project to a multi-player mobile app-experience.

The apps I developed to support the project:

- a mobile app with a card-like interface `react-native` `mqtt`
- a graph-based editor (written from scratch) for the writing team to make the scenarios `solid-js`
- a visual editor for the graphic designer to adjust the designs of the cards `solid-js`
- a dashboard to monitor active games `solid-js` `mqtt`

The backend-stack:

- `nginx` as proxy
- `express` REST-server
- `mongodb` database for scenarios
- `redis` database for active games
- `MQTT`-broker

The project was hosted on a `digitalocean droplet`.

I have re-written and re-factored `backend`, `play` (react-native mobile app) and `editor` (the visual editor) to typescript as an exercise, since I didn't use typescript when starting this project. There are still some doubtful design choices, but it's at least presentable.

In the process I wrote [typed-mqtt](https://github.com/bigmistqke/typed-mqtt), a typesafe wrapper around the mqtt-client I was using.

The Dating Project was very formative and I elevated my practice a lot in the process. If I would re-do it, I would do it in typescript, use `trpc` as a typesafe way to communicate with the server from `react native` and `solid-js`, use `jest` as testing environment and deploy it serverless.
