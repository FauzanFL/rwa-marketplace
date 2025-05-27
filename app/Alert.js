import { useEffect, useState } from "react";

export default function Alert({ message, type = "success", duration = 2000, onClose }) {
    const [animation, setAnimation] = useState("alert-in");

    const bgColor = {
        success: "bg-green-500",
        error: "bg-red-500",
        warning: "bg-yellow-500",
        info: "bg-blue-500",
    }[type];

    useEffect(() => {
        const hideTimer = setTimeout(() => {
            setAnimation("alert-out");
        }, duration - 400);

        const removeTimer = setTimeout(() => {
            onClose?.();
        }, duration);

        return () => {
            clearTimeout(hideTimer);
            clearTimeout(removeTimer);
        };
    }, [duration, onClose]);

    return (
        <div className="fixed top-4 left-1/2 z-50">
            <div
                className={`
                px-4 py-2 rounded text-white shadow-md transform
                ${bgColor} ${animation}
                `}
            >
                {message}
            </div>
        </div>
    );
}
