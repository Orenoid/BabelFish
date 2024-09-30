"use client"

import React from 'react';
import StringToReactComponent from 'string-to-react-component';




export default function Root() {

    return (
        <div>
            <h1>Custom Component Plugin</h1>
            <StringToReactComponent>
                {`(props)=>{
         const [counter,setCounter]=React.useState(0); // by default your code has access to the React object
         const increase=()=>{
           setCounter(counter+1);
         };
         return (<>
           <button onClick={increase}>+</button>
           <span>{'counter : '+ counter}</span>
        </>)
       }`}
            </StringToReactComponent>
        </div>
    );
}