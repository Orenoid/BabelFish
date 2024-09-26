"use client"

import { useEffect, useReducer, useState } from "react";
import { AddNewChat, type ChatSelection, ChatSelectionListLoader, UpdateChatTitle } from "../lib/chat";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { FiMoreHorizontal } from "react-icons/fi";


interface ChatSelectionListProps {
    chatSelectionListLoader: ChatSelectionListLoader
    className?: string;
}

export function ChatSelectionList({ chatSelectionListLoader, className = "" }: ChatSelectionListProps) {

    const chatSelectionList = useAppSelector((state) => state.chatSelectionList)
    const dispatch = useAppDispatch()


    useEffect(() => {
        const chatSelectionList2 = chatSelectionListLoader()
        dispatch(setChatSelectionList(chatSelectionList2.chatSelectionList))
        let chatIDToSelect: string | undefined
        if (chatSelectionList2.currentSelectedChatID === undefined &&
            chatSelectionList2.chatSelectionList.length > 0) {
            chatIDToSelect = chatSelectionList2.chatSelectionList[0].id
        } else if (chatSelectionList2.currentSelectedChatID) {
            chatIDToSelect = chatSelectionList2.currentSelectedChatID
        }
        if (chatIDToSelect !== undefined) {
            dispatch(setCurrentChatID(chatIDToSelect))
        }
    }, [chatSelectionListLoader, dispatch])

    return <div className={`${className}`}>
        {chatSelectionList.selectionList.map((item) => {
            return <ChatSelection selected={item.id === chatSelectionList.currentChatID}
                id={item.id} key={item.id} title={item.title} />
        })}
    </div>

}

export function NewChat({ addNewChat2, className = "" }: {
    addNewChat2: AddNewChat, className?: string
}) {
    const dispatch = useAppDispatch()
    const handleClick = () => {
        const chatSelection = addNewChat2("New Chat", [{ "role": "system", "content": "You're a helpful assistant." }])
        dispatch(addNewChat(chatSelection.chatSelection))
    }

    return <div className={`py-2 pl-2 my-1 cursor-pointer rounded-md hover:bg-gray-200 ${className}`}>
        <button onClick={handleClick}>New Chat</button>
    </div>
}

type ChatSelectionCompState =
    | { type: 'normal' }
    | { type: 'menuOpen' }
    | { type: 'editingTitle' }

export function ChatSelection({ id: chatID, title, className = "", selected = false }: { id: string, title: string, className?: string, selected?: boolean }) {
    // three state: normal(initial), menu open, editing title
    // normal => menu open, trigger by click the more button
    // menu open => editing title, trigger by click edit title button
    // menu open => normal, trigger by click outside the menu
    // editing title => menu open, trigger by click outside input area or press enter

    const initialState: ChatSelectionCompState = { type: 'normal' }
    const reducer = (state: ChatSelectionCompState, action: { type: string }): ChatSelectionCompState => {
        switch (state.type) {
            case 'normal':
                switch (action.type) {
                    case 'openMenu':
                        return { type: 'menuOpen' }
                }
            case 'menuOpen':
                switch (action.type) {
                    case 'editTitle':
                        return { type: 'editingTitle' }
                    case 'closeMenu':
                        return { type: 'normal' }
                }
            case 'editingTitle':
                switch (action.type) {
                    case 'saveTitle':
                        return { type: 'normal' }
                }
            default:
                return state
        }
    };
    const [compState, dispatchCompState] = useReducer(reducer, initialState);
    const [titleForEditing, setTitleForEditing] = useState(title)

    const dispatch = useAppDispatch()
    const handleClick = () => {
        dispatch(setCurrentChatID(chatID))
    }

    function _updateChatTitle(chatID: string, newTitle: string) {
        UpdateChatTitle(chatID, newTitle)
        dispatch(updateChatTitle({ chatID, newTitle }))
    }

    switch (compState.type) {
        case 'normal':
            return (
                <div className={`pl-4 py-2 pr-2 my-1 cursor-pointer rounded-md hover:bg-gray-200 ${className} ${selected ? "bg-gray-200" : ""}`} onClick={handleClick}>
                    <div className="flex flex-row justify-between">
                        <span>{title}</span>
                        <div className="hover:bg-gray-300 rounded-full p-1"
                            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                e.stopPropagation()
                                dispatchCompState({ type: 'openMenu' })
                            }}>
                            <FiMoreHorizontal className="ml-auto" />
                        </div>

                    </div>
                </div>
            )
        case 'menuOpen':
            return (
                <div className="relative">
                    <div className={`pl-4 py-2 pr-2 my-1 cursor-pointer rounded-md hover:bg-gray-200 ${className} ${selected ? "bg-gray-200" : ""}`} onClick={handleClick}>
                        <div className="flex flex-row">
                            <span>{title}</span>
                            <FiMoreHorizontal className="ml-auto" />
                        </div>
                    </div>
                    <div className="absolute right-0 z-10 bg-white border rounded-md">
                        {/* Dropdown menu items can be added here */}
                        <div className="p-2 cursor-pointer" onClick={() => dispatchCompState({ type: 'editTitle' })}>
                            Edit Title
                        </div>
                    </div>
                    <div className="fixed inset-0 bg-white opacity-0"
                        onClick={() => dispatchCompState({ type: 'closeMenu' })}></div>
                </div>
            )
        case 'editingTitle':
            return (
                <div className="relative">
                    <div className={`pl-4 py-2 pr-2 my-1 cursor-pointer rounded-md hover:bg-gray-200 ${className} ${selected ? "bg-gray-200" : ""}`} onClick={handleClick}>
                        <div className="flex flex-row">
                            <input className="border z-10" type="text" autoFocus
                                value={titleForEditing} onChange={(e) => setTitleForEditing(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        _updateChatTitle(chatID, titleForEditing)
                                        dispatchCompState({ type: 'saveTitle' })
                                    }
                                }}
                            />
                            <div className="fixed inset-0 bg-white opacity-0"
                                onClick={() => {
                                    _updateChatTitle(chatID, titleForEditing)
                                    dispatchCompState({ type: 'saveTitle' })
                                }}></div>
                        </div>
                    </div>

                </div>

            )
    }
}

const initialChatSelectionListState: {
    selectionList: ChatSelection[]
    currentChatID: string | undefined
} = {
    selectionList: [],
    currentChatID: undefined
}
const chatSelectionListSlice = createSlice(
    {
        name: 'chatSelectionList',
        initialState: initialChatSelectionListState,
        reducers: {
            addNewChat: (state, chatSelection: PayloadAction<ChatSelection>) => {
                state.selectionList = [chatSelection.payload, ...state.selectionList]
                state.currentChatID = chatSelection.payload.id
            },
            setChatSelectionList: (state, chatSelectionList: PayloadAction<ChatSelection[]>) => {
                state.selectionList = chatSelectionList.payload
            },
            setCurrentChatID: (state, chatID: PayloadAction<string>) => {
                state.currentChatID = chatID.payload
            },
            updateChatTitle: (state, action: PayloadAction<{ chatID: string, newTitle: string }>) => {
                const chat = state.selectionList.find(item => item.id === action.payload.chatID)
                if (chat) {
                    chat.title = action.payload.newTitle
                }
            }
        }
    },
)
export const { addNewChat, setChatSelectionList, setCurrentChatID, updateChatTitle } = chatSelectionListSlice.actions
export const chatSelectionListReducer = chatSelectionListSlice.reducer
