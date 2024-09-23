export function LoadChatSelectionListFromLocalStorage(): {
    chatSelectionList: ChatSelection[], currentSelectedChatID?: string
} {
    // 从 localStorage 读取 chat selection list 和当前选择的 chat ID
    const chatSelectionListJSON = localStorage.getItem('chatSelectionList');
    const currentSelectedChatID = localStorage.getItem('currentSelectedChatID');

    // 如果 localStorage 中没有数据，返回默认值
    if (!chatSelectionListJSON) {
        return {
            chatSelectionList: [],
            currentSelectedChatID: undefined
        };
    }

    return {
        chatSelectionList: JSON.parse(chatSelectionListJSON),
        currentSelectedChatID: currentSelectedChatID || undefined
    };
}

// export function LoadChatSelectionListFromLocalStorage(): {
//     chatSelectionList: ChatSelection[], currentSelectedChatID?: string
// } {
//     // TODO load chat selection list from LocalStorage
//     return {
//         chatSelectionList: [
//             {
//                 "id": "1",
//                 "title": "Whatever"
//             },
//             {
//                 "id": "2",
//                 "title": "Whatever 2",
//             }
//         ],
//         currentSelectedChatID: "1"
//     }
// }

// export function LoadChatByIDFromLocalStorage(chatID: string): Message[] {
//     let messageList: Message[]
//     switch (chatID) {
//         case "1":
//             messageList = [
//                 { role: "system", content: "You're a helpful assistant1." },
//                 { role: "user", content: "Hello, how are you?" },
//                 { role: "assistant", content: "I'm fine, thank you!" },
//                 { role: "user", content: "What's your name?" },
//                 { role: "assistant", content: "I'm BabelFish." },
//                 { role: "user", content: "What's your favorite color?" },
//                 { role: "assistant", content: "I'm blue." },
//                 { role: "user", content: "What's your favorite food?" },
//                 { role: "assistant", content: "I'm pizza." },
//                 { role: "user", content: "What's your favorite drink?" },
//                 { role: "assistant", content: "I'm coffee." },
//                 { role: "user", content: "What's your favorite movie?" },
//                 { role: "assistant", content: "I'm The Matrix." },
//                 { role: "user", content: "What's your favorite book?" },
//                 { role: "assistant", content: "I'm The Bible." },
//                 { role: "user", content: "What's your favorite game?" },
//                 { role: "assistant", content: "I'm The Matrix." },
//             ]
//             break;
//         case "2":
//             messageList = [
//                 { role: "system", content: "You're a helpful assistant2." },
//                 { role: "user", content: "Hello, how are you?" },
//                 { role: "assistant", content: "I'm fine, thank you!" },
//             ]
//             break;
//         default:
//             messageList = []
//     }
//     return messageList
// }

export function LoadChatByIDFromLocalStorage(chatID: string): Message[] {
    // 从 localStorage 根据 chatID 读取消息列表
    const messageListJSON = localStorage.getItem(`chat_${chatID}`);
    
    // 如果 localStorage 中没有数据，返回空数组
    if (!messageListJSON) {
        return [];
    }

    return JSON.parse(messageListJSON);
}

export function AddNewChat(
    chatTitle: string = "New Chat",
    initialMessageList: Message[] = []
): { 
    chatSelection: ChatSelection,
} {
    // 从 localStorage 读取现有的 chat selection list
    const chatSelectionListJSON = localStorage.getItem('chatSelectionList');
    const chatSelectionList: ChatSelection[] = chatSelectionListJSON ? JSON.parse(chatSelectionListJSON) : [];

    // 新的 chat ID
    const newChatID = (chatSelectionList.length + 1).toString();

    // 新的聊天选择项
    const newChatSelection: ChatSelection = { id: newChatID, title: chatTitle };

    // 将新聊天添加到列表中
    chatSelectionList.unshift(newChatSelection);

    // 更新 localStorage 中的 chat selection list
    localStorage.setItem('chatSelectionList', JSON.stringify(chatSelectionList));

    // 将初始消息列表保存到 localStorage 中
    localStorage.setItem(`chat_${newChatID}`, JSON.stringify(initialMessageList));

    return {
        chatSelection: newChatSelection
    };
}

export function AddMesssageInChat(chatID: string, message: Message): void {
    // 从 localStorage 读取现有的消息列表
    const messageListJSON = localStorage.getItem(`chat_${chatID}`);
    const messageList: Message[] = messageListJSON ? JSON.parse(messageListJSON) : [];

    // 将新的消息添加到消息列表中
    messageList.push(message);

    // 更新 localStorage 中的消息列表
    localStorage.setItem(`chat_${chatID}`, JSON.stringify(messageList));
}



export interface ChatSelectionListLoader {
    (): { chatSelectionList: ChatSelection[], currentSelectedChatID?: string };
}

export interface ChatLoader {
    (chatID: string): Message[]
}

export interface AddNewChat {
    (chatTitle?:string, initialMessageList?: Message[]): {
        chatSelection: ChatSelection
    }
}

export interface AddMesssageInChat {
    (chatID: string, message: Message): void
}

export interface ChatSelection {
    id: string;
    title: string;
}

export interface Message {
    role: string;
    content: string;
}

