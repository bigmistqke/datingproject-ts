// TODO: find replacement for qr-code scanner
// import QRCodeScanner from 'react-native-qrcode-scanner';
import { styled } from 'solid-styled-components';
import { BarcodeScanner } from "@capacitor-community/barcode-scanner"
// TODO: find replacement for Keyboard
// import { Keyboard } from 'react-native';

function ScanScreen({ onRead }) {
  let input_ref;
  const TextInput = styled("input")`
    position: relative;
    z-index:99;
    background:white;
    border: 1px solid black;
  `

  const startScan = async () => {
    BarcodeScanner.hideBackground(); // make background of WebView transparent

    const result = await BarcodeScanner.startScan(); // start scanning and wait for a result

    // if the result has content
    if (result.hasContent) {
      console.log(result.content); // log the raw scanned content
    }
  };
  startScan();
  return (<>
    <div style={{ position: 'relative' }}>
      HALLO

      <TextInput
        ref={input_ref}
        onSubmitEditing={() => onRead(input_ref.value)}
      ></TextInput>
    </div>
  </>)
}

export default ScanScreen;
