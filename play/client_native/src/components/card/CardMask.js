import styled from 'styled-components/native';

const CardMask = props => {
  const Mask = styled.View`
    width: 100%;
    height: 100%;
    position: absolute;
  `;

  return (
    <Mask
      className="masked"
      style={{
        'clip-path': `polygon(0%  ${props.percentage}%, 100%  ${props.percentage}%, 100% 100%, 0% 100%)`,
      }}>
      {props.children}
    </Mask>
  );
};

export default CardMask;
