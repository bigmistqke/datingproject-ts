import qrcode from 'qrcode-generator'
import { createEffect, onMount } from 'solid-js'
import './QR.css'

export default function QR(props) {
  let qr_dom
  createEffect(() => {
    if (!props.data.game_url) return
    var typeNumber = 2
    var errorCorrectionLevel = 'L'
    var qr = qrcode(typeNumber, errorCorrectionLevel)
    qr.addData(props.data.game_url)
    qr.make()

    qr_dom.innerHTML = qr.createSvgTag(5)
  })
  return (
    <>
      <div className="qr">
        <div style={{ width: '100%', 'text-align': 'center' }}>{props.data.game_url}</div>
        <div ref={qr_dom}></div>
      </div>
      <div onClick={props.closeQR} className="close"></div>
    </>
  )
}
