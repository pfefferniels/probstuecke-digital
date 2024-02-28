import React, { createContext, useContext, useEffect, useState } from 'react';

declare global {
    interface Window {
        verovio: any;
    }
}

window.verovio = window.verovio || {};

interface VerovioContextType {
    verovioReady: boolean;
}

const VerovioContext = createContext<VerovioContextType>({
    verovioReady: false
});

interface VerovioProviderProps {
    children: React.ReactNode;
}

export const VerovioProvider = ({ children }: VerovioProviderProps) => {
    const [verovioReady, setVerovioReady] = useState(false)

    useEffect(() => {
        const script = document.createElement("script");
        script.type = "application/javascript";
        script.src = "/verovio-toolkit-wasm.js";
        document.body.appendChild(script);

        const verovioHandler = () => {
            window.verovio.module.onRuntimeInitialized = () => {
                setTimeout(() => {
                    setVerovioReady(true)
                })
            };
        };

        script.defer = true;
        script.addEventListener("load", verovioHandler);
        return () => {
            script.removeEventListener("load", verovioHandler);
        };
    }, []);

    return (
        <VerovioContext.Provider value={{ verovioReady }}>
            {children}
        </VerovioContext.Provider>
    );
};

export const useVerovio = () => {
    const { verovioReady } = useContext(VerovioContext);
    const [vrvToolkit, setVrvToolkit] = useState<any>();

    useEffect(() => {
        if (!verovioReady) return

        setVrvToolkit(new window.verovio.toolkit())
    }, [verovioReady]);

    return { vrvToolkit };
};
