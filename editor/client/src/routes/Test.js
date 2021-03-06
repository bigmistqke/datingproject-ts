import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import Iframe from 'react-iframe'

import getData from "../helpers/getData";
import '../css/Test.css';


function Test() {
    const history = useHistory();

    const { room_id } = useParams();
    const [roles, setRoles] = useState({});

    useEffect(() => {
        console.log('room_id', room_id);
        getData(`${window._url.fetch}/api/getRolesRoom/${room_id}`)
            .then(res => res.json())
            .then(res => {
                if (!res) return Promise.reject('errrr');
                console.log(res);
                setRoles(res);
            })
            .catch(err => {

            });
    }, [room_id])

    return (<div>
        {Object.entries(roles).map(([key, role_url]) =>
            <Iframe key={role_url} url={`${window._url.play}/${role_url}/unsafe`}></Iframe>
        )}
    </div>)
}

export default Test;