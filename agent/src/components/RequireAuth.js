import React, { useEffect } from 'react';
import useStore from '../store/store';
import Login from './Login';
import Register from './Register';

const RequireAuth = ({ children }) => {
    const agent = useStore(state => state.agent);
    const fetchCurrentAgent = useStore(state => state.fetchCurrentAgent);

    useEffect(() => {
        if (!agent) {
            fetchCurrentAgent();
        }
    }, [agent, fetchCurrentAgent]);

    if (!agent) {
        return <Login />;
        // return <Register />;
    }
    return children;
};

export default RequireAuth;
