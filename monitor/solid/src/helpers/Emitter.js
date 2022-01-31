export default function Emitter() {
  var eventTarget = document.createDocumentFragment();

  function addEventListener(type, listener, useCapture, wantsUntrusted) {
    return eventTarget.addEventListener(type, listener, useCapture, wantsUntrusted);
  }

  function dispatchEvent(event) {
    return eventTarget.dispatchEvent(event);
  }

  function removeEventListener(type, listener, useCapture) {
    return eventTarget.removeEventListener(type, listener, useCapture);
  }

  this.addEventListener = addEventListener;
  this.dispatchEvent = dispatchEvent;
  this.removeEventListener = removeEventListener;
}