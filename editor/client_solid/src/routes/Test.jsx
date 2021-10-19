import getData from "../helpers/getData";
import "../css/Test.css";

import { createSignal, For, onMount, createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { useParams } from "solid-app-router";

function Test(props) {
  // const history = useHistory();

  const { room_url } = useParams();
  //   const [getRoleUrls, setRoleUrls] = createSignal([]);
  let [state, setState] = createStore({ role_urls: undefined });

  onMount(() => {
    getData(`${props.urls.fetch}/api/room/getRoleUrls/${room_url}`)
      .then((res) => res.json())
      .then((res) => {
        if (!res) return Promise.reject("errrr");
        console.log(res.role_urls);
        console.log("state.role_urls", state.role_urls);
        setState("role_urls", res.role_urls);
        console.log("state.role_urls", state.role_urls);
      })
      .catch((err) => {});
  });

  createEffect(() => console.log(state.role_urls));

  return (
    <div className="flex-container">
      {
        <For each={state.role_urls}>
          {(role_url) => (
            <iframe
              src={`${props.urls.play}/${room_url}${role_url}/unsafe`}
            ></iframe>
          )}
        </For>
      }
    </div>
  );
}

export default Test;
