import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Instruction from './Instruction';
import uniqid from "uniqid";
import postData from "../helpers/postData";
import getData from "../helpers/getData";

import {
    useParams
} from "react-router-dom";

let current = {};

function decodeSingleQuotes(text) {
    return (text.replace(/&#039;/g, "'"));
}

const Script = forwardRef((props, ref) => {
    let { script_id } = useParams();
    // let defaultState = { instruction_id: uniqid(), script_id: 0, role: "a", type: "say", text: "" };
    let [rows, setRows] = useState([]);

    useEffect(() => {
        // console.table({effect: rows});
    });
    useEffect(() => {
        console.log("DOES THIS HAPPEN FOR SMOE ERASON?")
        getData(`https://fetch.datingproject.net/script/${script_id}`)
            .then(res => res.json())
            .then(res => {
                populateRows(res);
            });
    }, [script_id]);

    const populateRows = (rows) => {
        console.log("hallo");
        console.log(rows);
        if (rows.length === 0) { rows = [getDefaultRow()] };
        rows = rows.map((row) => {
            return { instruction_id: row.instruction_id, script_id: row.script_id, role: row.role, type: row.type, text: decodeSingleQuotes(row.text) }
        })
        current.rows = rows;
        setRows(rows);
    }

    useImperativeHandle(ref, () => ({
        save() {
            console.log(rows);
            postData("https://fetch.datingproject.net/save", current.rows)
                .then(res => res.json())
                .then(res => console.log(res));
        }
    }));

    let getIndex = (rowState) => { return current.rows.findIndex((el) => { return el.instruction_id === rowState.instruction_id }) }
    let getDefaultRow = () => { return { instruction_id: uniqid(), script_id: parseInt(script_id), role: "a", type: "say", text: "" } }
    const addRow = (rowState) => {
        let newRows = [...current.rows];
        let index = getIndex(rowState);
        let newRow = getDefaultRow();
        newRows.splice((index + 1), 0, newRow);
        current.rows = newRows;
        setRows(newRows);
    }
    const removeRow = (rowState) => {
        let newRows = [...current.rows];
        let index = getIndex(rowState);
        newRows.splice((index), 1);
        current.rows = newRows;
        setRows(newRows);
    };
    let changeRow = (rowState) => {
        let newRows = [...current.rows];
        let index = getIndex(rowState);
        rowState.instruction_id = newRows[index].instruction_id;
        rowState.script_id = newRows[index].script_id;
        newRows[index] = rowState;
        current.rows = newRows;
        setRows(newRows);
    }




    return (
        <div className="Instructions">
            {rows.map((q, i) => {
                // console.log(i);
                q.index = i;
                return <Instruction key={q.instruction_id} id={q.instruction_id} props={q} index={i} change={(rowState) => { changeRow(rowState) }} remove={(rowState) => { removeRow(rowState) }} add={(rowState) => { addRow(rowState) }} />;
            })}
        </div>
    )
})
export default Script;