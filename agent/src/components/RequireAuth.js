import React, { useEffect } from 'react';
import useStore from '../store/store';
import Login from './Login';
import Register from './Register';

const RequireAuth = ({ children }) => {
    const user = useStore(state => state.user);
    const fetchCurrentUser = useStore(state => state.fetchCurrentUser);

    useEffect(() => {
        if (!user) {
            fetchCurrentUser();
        }
    }, [user, fetchCurrentUser]);

    if (!user) {
        return <Login />;
    }
    return children;
};

export default RequireAuth;
