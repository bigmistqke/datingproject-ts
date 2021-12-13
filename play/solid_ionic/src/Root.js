import { Provider } from "./store/Store"
import App from "./App"

export default function Root() {
  return <Provider><App></App></Provider>
}