"use client"

import { useState } from "react"

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return <div className="w-1/4">
        <button onClick={() => setIsOpen(!isOpen)}>Open</button>
    </div>
}