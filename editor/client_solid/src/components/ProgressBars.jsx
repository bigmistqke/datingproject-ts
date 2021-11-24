import { createSignal } from "solid-js";
import { useStore } from "../managers/Store";

export default function ProgressBars(props) {
  const [uploaders, setUploaders] = createSignal({});
  const [state] = useStore();

  /* createEffect(() => {
    if (!state.videoUploader) return;
    state.videoUploader.addEventListener("update", ({ detail }) => {
      setUploaders(detail);
    });
  }); */

  return Object.keys(uploaders).length != 0 ? (
    <div className="progressBars">
      {uploaders.map(({ instruction_id, uploader }) => {
        return (
          <div key={instruction_id} className="progressBar">
            <div
              className="progress"
              style={{ width: `${uploader.progress.percentage}%` }}
            ></div>
            <div className="text">
              <span>
                {instruction_id} is {uploader.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  ) : null;
}
