import { HeaderPanel, HeaderCategory, LabeledInput } from "./UI_Components";
import uniqid from "uniqid";
import { onMount } from "solid-js";
import { createStore } from "solid-js/store";

const LayOut = (props) => {
  const [layout, setLayout] = createStore({
    horizontal: {
      amount: 0,
      padding: 0,
    },
    vertical: {
      amount: 0,
      padding: 0,
    },
  });

  const createLayout = (shouldAdd) => {
    let h_amount = layout.horizontal.amount;
    let h_padding = layout.horizontal.padding / 10;
    let v_amount = layout.vertical.amount;
    let v_padding =
      ((layout.vertical.padding / 10) * props.card_dimensions.height) /
      props.card_dimensions.width;

    const _guides = [];

    if (h_padding == 0) {
      for (let i = 0; i < h_amount + 2; i++) {
        let guide = {
          direction: "horizontal",
          position: (i * 100) / (h_amount + 1),
          key: uniqid(),
        };
        _guides.push(guide);
      }
    } else {
      h_amount = h_amount * 2;

      for (let i = 0; i < h_amount + 2; i++) {
        let guide = {
          direction: "horizontal",
          position:
            i === 0 || i === h_amount + 1
              ? (i * 100) / (h_amount + 1)
              : i % 2 == 0
              ? ((i / 2) * 100) / (h_amount / 2 + 1) + h_padding
              : (((i + 1) / 2) * 100) / (h_amount / 2 + 1) - h_padding,
          key: uniqid(),
        };
        _guides.push(guide);
      }
    }

    if (v_padding == 0) {
      for (let i = 0; i < v_amount + 2; i++) {
        let guide = {
          direction: "vertical",
          position: (i * 100) / (v_amount + 1),
          key: uniqid(),
        };
        _guides.push(guide);
      }
    } else {
      v_amount = v_amount * 2;

      for (let i = 0; i < v_amount + 2; i++) {
        let guide = {
          direction: "vertical",
          position:
            i === 0 || i === v_amount + 1
              ? (i * 100) / (v_amount + 1)
              : i % 2 == 0
              ? ((i / 2) * 100) / (v_amount / 2 + 1) + v_padding
              : (((i + 1) / 2) * 100) / (v_amount / 2 + 1) - v_padding,
          key: uniqid(),
        };

        _guides.push(guide);
      }
    }
    props.setGuides(_guides);
    // props.guides.updateAll(_guides);
  };

  const handleChange = (data) => {
    setLayout({ ...data });
  };

  onMount(() => {
    createLayout();
  });

  return (
    <>
      <HeaderPanel label="Guide LayOut" data={layout}>
        <div style={{ display: "flex" }}>
          {Object.entries(layout).map(([categoryName, viewport]) => (
            <HeaderCategory key={categoryName} label={categoryName}>
              {Object.entries(viewport).map(([elementName, element]) => (
                <LabeledInput
                  key={elementName}
                  label={elementName}
                  value={element}
                  onChange={(data) => {
                    let _category = { ...viewport, [elementName]: data };
                    setLayout({ ...layout, [categoryName]: _category });
                  }}
                ></LabeledInput>
              ))}
            </HeaderCategory>
          ))}
        </div>
        <div className="flex-container button-container">
          <button
            onClick={() => {
              createLayout(true);
            }}
          >
            create
          </button>
          <button onClick={props.toggleAreGuidesLocked}>
            {props.areGuidesLocked ? "unlock guides" : "lock guides"}
          </button>
        </div>
        <div className="flex-container button-container">
          <button onClick={props.toggleAreGuidesHidden}>
            {props.areGuidesHidden ? "show guides" : "hide guides"}
          </button>
          {/*  <button
          onClick={() => {
            viewport.blurredBorder.update(!viewport.blurredBorder.state);
          }}
        >
          {!viewport.blurredBorder.state ? "show borders" : "hide borders"}
        </button> */}
        </div>
      </HeaderPanel>
    </>
  );
};
export default LayOut;
