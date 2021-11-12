import { createSignal } from "solid-js";
import { HeaderPanel, LabeledColorPicker, FlexRow } from "./UI_Components";

const BackgroundPanel = (props) => {
  const [getSelected, setSelected] = createSignal(false);

  let input;

  return (
    <>
      <HeaderPanel label="Background Color">
        <FlexRow>
          <LabeledColorPicker
            label="color"
            value={props.background}
            onChange={props.setBackground}
            swatches={props.swatches}
          ></LabeledColorPicker>
        </FlexRow>
      </HeaderPanel>
    </>
  );
};
export default BackgroundPanel;
