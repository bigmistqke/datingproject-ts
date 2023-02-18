export default class Emitter {
  eventTarget = document.createDocumentFragment()

  addEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    useCapture: AddEventListenerOptions,
  ) => {
    return this.eventTarget.addEventListener(type, listener, useCapture)
  }

  dispatchEvent = (event: any) => {
    return this.eventTarget.dispatchEvent(event)
  }

  removeEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    useCapture: AddEventListenerOptions,
  ) => {
    return this.eventTarget.removeEventListener(type, listener, useCapture)
  }
}
