import React from "react";

export default function SaveButton({ onChildClick }) {
  return (
    <div className="child">
      <button onClick={onChildClick}>save</button>
    </div>
  );
}