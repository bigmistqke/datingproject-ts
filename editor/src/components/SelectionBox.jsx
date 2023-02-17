function SelectionBox(props) {
    return <div className='selectionBox' style={{
        top: props.data.top,
        left: props.data.left,
        width: props.data.width,
        height: props.data.height
    }}></div>
}

export default SelectionBox