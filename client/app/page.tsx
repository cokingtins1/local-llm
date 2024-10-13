"use client";

import { useEffect, useState } from "react";

export default function Home() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("http://localhost:8080/api/home")
            .then((res) => {
                return res.text();
            })
            .then((data) => setMessage(data));
    }, []);

    return (
        <div>
            <p>hello balls</p>
            <p className="text-white">{message && message}</p>
        </div>
    );
}
