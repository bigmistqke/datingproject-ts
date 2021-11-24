function For(props) {
  return <>{props.each.map((el, index) => props.children(el, index))}</>;
}
function Show(props) {
  return <>{props.when ? props.children : null}</>;
}

export { For, Show }
