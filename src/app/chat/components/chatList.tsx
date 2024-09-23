"use client"

import { useEffect } from "react";
import { AddNewChat, type ChatSelection, ChatSelectionListLoader } from "../lib/chat";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "@/app/hooks";

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
            return <ChatSelection className={item.id === chatSelectionList.currentChatID? "bg-gray-200":""}
             id={item.id} key={item.id} title={item.title} />
        })}
    </div>

}

export function NewChat({ addNewChat2, className = "" }: { addNewChat2: AddNewChat, className?: string }) {
    const dispatch = useAppDispatch()
    const handleClick = () => {
        const chatSelection = addNewChat2("New Chat", [{ "role": "system", "content": "You're a helpful assistant." }])
        dispatch(addNewChat(chatSelection.chatSelection))
    }

    return <div className={`pl-4 ${className}`}>
        <button onClick={handleClick}>New Chat</button>
    </div>
}

export function ChatSelection({ id, title, className = "" }: { id: string, title: string, className?: string }) {
    const dispatch = useAppDispatch()
    const handleClick = () => {
        dispatch(setCurrentChatID(id))
    }
    return <div className={`pl-4 py-2 my-1 cursor-pointer rounded-md hover:bg-gray-200 ${className}`} onClick={handleClick}>
        <span>{title}</span>
    </div>
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
            }
        }
    },
)
export const { addNewChat, setChatSelectionList, setCurrentChatID } = chatSelectionListSlice.actions
export const chatSelectionListReducer = chatSelectionListSlice.reducer
