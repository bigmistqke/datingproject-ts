import { styled } from "solid-styled-components";

const Row = styled("div")`
  display: flex;
  flex-direction: row;
  font-size: 10pt;
  /* line-height: var(--r-height); */
  /* min-height: var(--r-height); */
  margin: auto;
  overflow: hidden;
  cursor: default;
  width: 100%;
  line-height: calc(var(--r-height) * 3 / 4) !important;
  min-height: calc(var(--r-height) * 3 / 4) !important;
  & * {
    font-size: 10pt;
  }
`;

const Flex = styled("div")`
  flex: 1;
  display: flex;
`;

export { Row, Flex };
