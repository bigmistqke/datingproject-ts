import React from "react";
export default function SaveButton({data, onChildClick}) {
    return (
      <div className="child">
       <button onClick={onChildClick}>{data}</button>
      </div>
    );
  }