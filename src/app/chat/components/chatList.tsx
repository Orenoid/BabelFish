"use client"

import { useEffect, useState } from "react";
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

    return <div className={`py-2 pl-2 my-1 cursor-pointer rounded-md hover:bg-gray-200 ${className}`}
        onClick={handleClick}>
        <button>New Chat</button>
    </div>
}

export function ChatSelection({ id: chatID, title, className = "", selected = false }: { id: string, title: string, className?: string, selected?: boolean }) {

    const dispatch = useAppDispatch()
    const [compState, setCompState] = useState<'normal' | 'showMore' | { titleUnderEdit: string }>('normal')
    const isEditing = (typeof compState === 'object' && 'titleUnderEdit' in compState)
    const showMore = (compState === 'showMore')

    function _updateChatTitle(chatID: string, newTitle: string) {
        UpdateChatTitle(chatID, newTitle)
        dispatch(updateChatTitle({ chatID, newTitle }))
    }

    return (
        <div className={showMore || isEditing ? "relative" : ""}>
            <div className={`pl-4 py-2 pr-2 my-1 cursor-pointer rounded-md hover:bg-gray-200 ${className} ${selected ? "bg-gray-200" : ""}`}
                onClick={() => { dispatch(setCurrentChatID(chatID)) }}>
                {
                    !isEditing ?
                        <>
                            <div className="flex flex-row justify-between">
                                <span>{title}</span>
                                <div className="hover:bg-gray-300 rounded-full p-1"
                                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                        e.stopPropagation()
                                        setCompState('showMore')
                                    }}>
                                    <FiMoreHorizontal className="ml-auto" />
                                </div>
                            </div>
                        </> :
                        <>
                            <input className="border z-10" type="text" autoFocus
                                value={compState.titleUnderEdit} onChange={(e) => setCompState({ titleUnderEdit: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        _updateChatTitle(chatID, compState.titleUnderEdit)
                                        setCompState('normal')
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
                        setCompState('normal')
                    }}>
                </div>
            }
            {
                showMore && <>
                    <div className="absolute right-0 z-10 bg-white border rounded-md">
                        {/* Dropdown menu items can be added here */}
                        <div className="p-2 cursor-pointer" onClick={() => setCompState({ titleUnderEdit: title })}>
                            Edit Title
                        </div>
                    </div>
                    <div className="fixed inset-0 bg-white opacity-0"
                        onClick={() => setCompState('normal')}>
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
