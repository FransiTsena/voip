import React from 'react';
import useStore from '../store/store';
import Login from './Login';

const RequireAuth = ({ children }) => {
    const agent = useStore(state => state.agent);
    if (!agent) {
        return <Login />;
    }
    return children;
};

export default RequireAuth;
