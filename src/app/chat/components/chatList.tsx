"use client"

import { useEffect, useState } from "react";
import { AddNewChat, type ChatSelection, ChatSelectionListLoader, UpdateChatTitle } from "../lib/chat";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { FiMoreHorizontal } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";
import { SystemMessage } from "./message";
import { MdModeEdit } from "react-icons/md";
import { SiTheconversation } from "react-icons/si";


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

export function NewChat({ addNewChat: addNewChat2, className = "" }: {
    addNewChat: AddNewChat, className?: string
}) {
    const dispatch = useAppDispatch()
    const handleClick = () => {
        const chatSelection = addNewChat2("New Chat", [
            new SystemMessage("You're a helpful assistant.")
        ])
        dispatch(addNewChat(chatSelection.chatSelection))
    }

    return <div className={`flex flex-row py-2 pl-3 my-1 items-center cursor-pointer rounded-md hover:bg-gray-200 ${className}`}
        onClick={handleClick}>
        <FaPlus className="mr-3" />
        <button>New Chat</button>
    </div>
}

export function ChatSelection({ id: chatID, title, className = "", selected = false }: { id: string, title: string, className?: string, selected?: boolean }) {

    const dispatch = useAppDispatch()
    const [compState, setCompState] = useState<{ type: 'normal', showMoreBtn: boolean } | { type: 'showMore' } | { type: 'titleUnderEdit', titleUnderEdit: string }>({ type: 'normal', showMoreBtn: false })
    const isNormal = (compState.type === 'normal')
    const isEditing = (compState.type === 'titleUnderEdit')
    const showMore = (compState.type === 'showMore')

    function _updateChatTitle(chatID: string, newTitle: string) {
        UpdateChatTitle(chatID, newTitle)
        dispatch(updateChatTitle({ chatID, newTitle }))
    }

    return (
        <div className={showMore || isEditing ? "relative" : ""}>
            <div className={`pl-4 py-2 pr-2 my-1 cursor-pointer rounded-md hover:bg-gray-200 ${className} ${selected ? "bg-gray-200" : ""}`}
                onClick={() => { dispatch(setCurrentChatID(chatID)) }}
                onMouseEnter={() => {
                    if (isNormal) {
                        setCompState({ type: 'normal', showMoreBtn: true })
                    }
                }}
                onMouseLeave={() => {
                    if (isNormal) {
                        setCompState({ type: 'normal', showMoreBtn: false })
                    }
                }}
            >
                {
                    !isEditing ?
                        <>
                            <div className="flex flex-row justify-between">
                                <div className="flex items-center">
                                    <SiTheconversation className="mr-4" />
                                    <span>{title}</span>
                                </div>
                                <div className={`hover:bg-gray-300 rounded-full p-1 ${showMore && "bg-gray-300"}`}
                                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                        e.stopPropagation()
                                        setCompState({ type: 'showMore' })
                                    }}>
                                    {((isNormal && compState.showMoreBtn) || showMore) && <FiMoreHorizontal className="ml-auto" />}
                                </div>
                            </div>
                        </> :
                        <>
                            <input className="border z-10" type="text" autoFocus
                                value={compState.titleUnderEdit} onChange={(e) => setCompState({ type: 'titleUnderEdit', titleUnderEdit: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        _updateChatTitle(chatID, compState.titleUnderEdit)
                                        setCompState({ type: 'normal', showMoreBtn: false })
                                    }
                                }}
                            />
                        </>
                }
            </div>
            {
                isEditing &&
                <div className="fixed inset-0 bg-white opacity-0"
                    onClick={() => {
                        _updateChatTitle(chatID, compState.titleUnderEdit)
                        setCompState({ type: 'normal', showMoreBtn: false })
                    }}>
                </div>
            }
            {
                showMore && <>
                    <div className="absolute right-0 z-10 bg-white border rounded-md">
                        {/* Dropdown menu items can be added here */}
                        <div className="p-2 cursor-pointer hover:bg-gray-100" onClick={() => setCompState({ type: 'titleUnderEdit', titleUnderEdit: title })}>
                            <MdModeEdit className="inline-block mr-1" /> Rename
                        </div>
                    </div>
                    <div className="fixed inset-0 bg-white opacity-0"
                        onClick={() => setCompState({ type: 'normal', showMoreBtn: false })}>
                    </div>
                </>
            }
        </div>
    )
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
