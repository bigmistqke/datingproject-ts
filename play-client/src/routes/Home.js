import React, {useEffect} from "react";
import getData from '../helpers/getData';


const Home = () => {
    async function getAllScripts() {
        return getData(`https://fetch.datingproject.net/scripts`)
            .then(res => res.json())
            .then(script => {
                script.sort((a, b) => { return a.instruction_order - b.instruction_order })
                return script;
            });
    }

    useEffect(()=>{
        getAllScripts().then((allScripts)=>{
            console.log(allScripts);
        })
    }, [])

    return <div></div>
}
export default Home