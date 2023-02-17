import getData from "../helpers/getData";

import { createSignal, For, onMount } from "solid-js";
import urls from "../urls";

let current = {};

function List() {
  const [scripts, setScripts] = createSignal([]);

  const fetchScripts = async () => {
    let scripts = await getData(`${urls.fetch}/api/script/get_all`);
    scripts = scripts.sort((a, b) => a > b);
    console.log(scripts.length);
    setScripts(scripts);
  };

  const removeScript = async (script_name) => {
    let result = await getData(
      `${urls.fetch}/api/script/delete/${script_name}`
    );
    console.log(result);
  };

  onMount(() => fetchScripts());

  return (
    <div className="App">
      <div style={{ overflow: "auto", height: "100vh" }}>
        <For each={scripts()}>
          {(script_name) => (
            <div style={{ display: "flex", width: "100%" }}>
              <a href={`/${script_name}`} target="_blank" style={{ flex: 1 }}>
                {script_name}
              </a>
              {/* <button onClick={() => removeScript(script_name)}>delete </button> */}
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
export default List;
