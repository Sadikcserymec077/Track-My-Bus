import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('bustrack_token');
        const savedUser = localStorage.getItem('bustrack_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        }
        setLoading(false);
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('bustrack_token', authToken);
        localStorage.setItem('bustrack_user', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('bustrack_token');
        localStorage.removeItem('bustrack_user');
        delete api.defaults.headers.common['Authorization'];
    };

    const updateUser = (updates) => {
        const updated = { ...user, ...updates };
        setUser(updated);
        localStorage.setItem('bustrack_user', JSON.stringify(updated));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
