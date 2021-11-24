import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import Iframe from 'react-iframe'

import getData from "../helpers/getData";
import '../css/Test.css';


function Test() {
    const history = useHistory();

    const { room_url } = useParams();
    const [roles, setRoles] = useState({});

    useEffect(() => {
        ////console.log('room_url', room_url);
        getData(`${window._url.fetch}/api/room/getRoleUrls/${room_url}`)
            .then(res => res.json())
            .then(res => {
                if (!res) return Promise.reject('errrr');
                ////console.log(res);
                setRoles(res.role_urls);
            })
            .catch(err => {

            });
    }, [room_url])

    return (<div className='flex-container'>
        {roles ? Object.entries(roles).map(([key, role_url]) =>
            <Iframe key={role_url} url={`${window._url.play}/${room_url}${role_url}/unsafe`}></Iframe>
        ) : null}
    </div>)
}

export default Test;