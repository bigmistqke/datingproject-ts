import { useStore } from "../../store/Store";

export default function VideoRenderer(props) {
  const [, actions] = useStore();

  const onVideoEnd = () => {
    console.info('video ended');
    actions.swipe(props.instruction);
  }
  return (
    <video autoplay onEnd={onVideoEnd}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        borderRadius: parseInt(actions.getBorderRadius() * 10),
      }}
      source={{ uri: props.url }}>
    </video>
  )
}
