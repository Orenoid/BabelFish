import { StreamingTextMessage, SystemMessage, TextMessage } from "../components/message";
import { Message } from "./message";

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

export function LoadChatByIDFromLocalStorage(chatID: string): Message[] {
    // 从 localStorage 根据 chatID 读取消息列表
    const messageListJSON = localStorage.getItem(`chat_${chatID}`);

    // 如果 localStorage 中没有数据，返回空数组
    if (!messageListJSON) {
        return [];
    }

    const rawMessages: string[] = JSON.parse(messageListJSON)
    // TODO set up a global hub to manage message constructors
    const messageList: Message[] = rawMessages.map((rawMsg) => {
        const { type, ...rest } = JSON.parse(rawMsg);
        switch (type) {
            case 'systemMessage':
                return SystemMessage.deserialize(JSON.stringify(rest));
            case 'text':
                return TextMessage.deserialize(JSON.stringify(rest));
            case 'streamingText':
                return StreamingTextMessage.deserialize(JSON.stringify(rest));
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    });

    return messageList;
}

export function UpdateMessageInChat(chatID: string, messageID: number, serialized: string): void {
    // 从 localStorage 读取现有的消息列表
    const messageListJSON = localStorage.getItem(`chat_${chatID}`);
    const messageList: string[] = messageListJSON ? JSON.parse(messageListJSON) : [];

    // 检查消息ID是否存在
    if (messageID < 0 || messageID >= messageList.length) {
        console.error("Invalid message ID");
        return;
    }

    // 更新消息
    messageList[messageID] = serialized;

    // 更新 localStorage 中的消息列表
    localStorage.setItem(`chat_${chatID}`, JSON.stringify(messageList));
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
    localStorage.setItem(`chat_${newChatID}`, JSON.stringify(initialMessageList.map((msg) => msg.serialize())));

    return {
        chatSelection: newChatSelection
    };
}

export function AddMesssageInChat(chatID: string, message: Message): void {
    if (message.serialize() === "") {
        return
    }
    // 从 localStorage 读取现有的消息列表
    const messageListJSON = localStorage.getItem(`chat_${chatID}`);
    const messageList: string[] = messageListJSON ? JSON.parse(messageListJSON) : [];

    // 将新的消息添加到消息列表中
    messageList.push(message.serialize());

    // 更新 localStorage 中的消息列表
    localStorage.setItem(`chat_${chatID}`, JSON.stringify(messageList));
}

export function UpdateChatTitle(chatID: string, newTitle: string): void {
    // 从 localStorage 读取现有的 chat selection list
    const chatSelectionListJSON = localStorage.getItem('chatSelectionList');
    const chatSelectionList: ChatSelection[] = chatSelectionListJSON ? JSON.parse(chatSelectionListJSON) : [];

    // 更新 chat selection list 中的 title
    const chatSelection = chatSelectionList.find(chat => chat.id === chatID);
    if (chatSelection) {
        chatSelection.title = newTitle;
    }

    // 更新 localStorage 中的 chat selection list
    localStorage.setItem('chatSelectionList', JSON.stringify(chatSelectionList));
}


export interface ChatSelectionListLoader {
    (): { chatSelectionList: ChatSelection[], currentSelectedChatID?: string };
}

export interface ChatLoader {
    (chatID: string): Message[]
}

export interface AddNewChat {
    (chatTitle?: string, initialMessageList?: Message[]): {
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