import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import Editor from "@/views/Editor.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/:script_id",
    name: "Editor",
    component: Editor
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
