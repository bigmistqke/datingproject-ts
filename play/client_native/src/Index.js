import { Provider } from "./Store"
import React, { useEffect, useState, useRef, useCallback } from 'react';
import App from "./App"

export default function Index() {
  return <Provider><App></App></Provider>
}