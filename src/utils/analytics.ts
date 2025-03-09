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

export const sendPageView = (path: string) => {
    if (window.gtag) {
        window.gtag('config', trackID, {
            page_path: path,
        });
    }
};