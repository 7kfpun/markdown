import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => {
            console.log('[App] Online status: connected');
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log('[App] Online status: disconnected');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};
