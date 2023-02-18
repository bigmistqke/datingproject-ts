export function getCaretPosition(element) {
  let caretOffset = 0
  let doc = element.ownerDocument || element.document
  let win = doc.defaultView || doc.parentWindow
  let sel
  if (typeof win.getSelection != 'undefined') {
    sel = win.getSelection()
    if (sel.rangeCount > 0) {
      let range = win.getSelection().getRangeAt(0)
      let preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(element)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      caretOffset = preCaretRange.toString().length
    }
  } else if ((sel = doc.selection) && sel.type != 'Control') {
    let textRange = sel.createRange()
    let preCaretTextRange = doc.body.createTextRange()
    preCaretTextRange.moveToElementText(element)
    preCaretTextRange.setEndPoint('EndToEnd', textRange)
    caretOffset = preCaretTextRange.text.length
  }
  return caretOffset
}

export function setCaretPosition(element, index) {
  let sel = window.getSelection()
  let offset = sel.focusOffset

  let range = document.createRange()
  range.selectNode(element.firstChild)
  range.setStart(element.firstChild, index, 0)

  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}
