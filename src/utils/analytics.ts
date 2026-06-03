import trackID from '../ga/config';

declare global {
    interface Window {
        gtag: (
            command: string,
            action: string,
            params?: { [key: string]: any }
        ) => void;
    }
}

const isDebug = process.env.NODE_ENV === 'development';

export const sendPageView = (path: string) => {
    if (window.gtag) {
        window.gtag('config', trackID, {
            page_path: path,
            ...(isDebug && { debug_mode: true }),
        });
    }
};