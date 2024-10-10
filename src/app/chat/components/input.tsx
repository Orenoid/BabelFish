"use client";

import { IMediaRecorder, MediaRecorder, register } from "extendable-media-recorder";
import { connect } from "extendable-media-recorder-wav-encoder";
import { Dispatch, SetStateAction, useState, useRef, useEffect } from "react";
import { FaBackspace, FaSpellCheck } from "react-icons/fa";
import { LuUserCog2 } from "react-icons/lu";
import { MdGTranslate } from "react-icons/md";
import { TbPencilQuestion } from "react-icons/tb";
import { Oval } from "react-loader-spinner"; 
import { messageAddedCallbackOptions } from "./chat";
import { TextMessage } from "./message";
import { diffChars } from "diff";
import { LiaComments } from "react-icons/lia";
import { PiKeyReturnBold } from "react-icons/pi";
import { Message } from "../lib/message";
import { reviseMessageAction } from "../lib/chat-server";

export interface RevisionEntry {
    iconNode: React.ReactNode;
    userInstruction: string;
    // allow the icon to specify a callback to handle its custom shortcut key
    shortcutCallback?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
}

const defaultRevisions: RevisionEntry[] = [
    {
        iconNode: <MdGTranslate size={20} />, userInstruction: "How do I say it in English to express the same meaning?",
        shortcutCallback: (e: React.KeyboardEvent<HTMLTextAreaElement>) => e.key === 'k' && (e.metaKey || e.ctrlKey)
    },
    {
        iconNode: <TbPencilQuestion size={20} title="Ask AI to answer this question" />, userInstruction: "Help me respond to this message",
        shortcutCallback: (e: React.KeyboardEvent<HTMLTextAreaElement>) => e.key === '/' && (e.metaKey || e.ctrlKey)
    },
    {
        iconNode: <FaSpellCheck size={20} className="ml-[-2px]" />, userInstruction: "Correct grammar issue",
        shortcutCallback: (e: React.KeyboardEvent<HTMLTextAreaElement>) => e.key === 'g' && (e.metaKey || e.ctrlKey)
    }
];

export async function reviseMessage(
    messageToRevise: string,
    userInstruction: string,
    historyMessages: Message[],
    includeHistory: boolean = true,
    historyMessageCount: number | undefined = undefined) {

    const historyContext = includeHistory ?
        historyMessages.slice(-(historyMessageCount ?? historyMessages.length)).
            filter((msg) => msg.includedInChatCompletion).
            map(msg => `[START]${msg.role}: ${msg.toJSON().content}[END]`).join('\n') : "";

    const revisionPrompt = `${includeHistory ? `This is an ongoing conversation:
    """
    ${historyContext}
    """` : ""}
    This is a message the user is about to send in conversation:
    """
    ${messageToRevise}
    """
    If the message is empty, it potentially means the user needs a answer suggestion.

    This is the user's instruction or question:
    """
    ${userInstruction}
    """
    
    Please generate a suggestion based on the user's instruction or question, considering the context of the conversation, and return it in the following JSON format, while preserving the user's line breaks and formatting if any:
    """
    {
        "suggested_answer": "..."
    }
    """

    IMPORTANT: The suggested_answer you generate is intended for the user to respond to another conversation, not to reply to the user's current instruction or question.
    `;

    const revisedText = await reviseMessageAction({ role: 'user', content: revisionPrompt });
    return revisedText;
}

export type MessageInputState = { type: 'normal'; messageContent: string; } |
{ type: 'revising'; messageContent: string; revisingIndex: number; } |
{ type: 'waitingApproval'; messageContent: string; revisedText: string; revisingInstruction: string; };

export function MessageInput({
    state: compState, setState: setCompState, messageList, addMesssage, allowFollowUpDiscussion, startFollowUpDiscussion, className = ""
}: {
    state: MessageInputState;
    setState: Dispatch<SetStateAction<MessageInputState>>;
    messageList: Message[];
    addMesssage: (message: Message, callbackOpts?: messageAddedCallbackOptions) => void;
    allowFollowUpDiscussion: boolean;
    startFollowUpDiscussion: (userInstruction: string, messageToRevise: string, revisedText: string) => void;
    className?: string;
}) {

    const messageContent = compState.messageContent;

    const isNormal = compState.type === 'normal';
    const waitingForApproval = compState.type === 'waitingApproval';

    async function startRevising(triggeredIndex: number) {
        if (!isNormal) {
            return;
        }
        setCompState({ type: 'revising', revisingIndex: triggeredIndex, messageContent: compState.messageContent });
        const userInstruction = defaultRevisions[triggeredIndex].userInstruction;
        const revisedText = await reviseMessage(messageContent, userInstruction, messageList);
        setCompState({
            type: 'waitingApproval',
            revisedText: revisedText,
            revisingInstruction: userInstruction,
            messageContent: compState.messageContent
        });
    }

    function approveRevision(revisedText: string) {
        if (!waitingForApproval) {
            return;
        }
        setCompState({ type: 'normal', messageContent: revisedText });
        // TODO
        // textAreaRef.current?.focus();
    }

    function rejectRevision() {
        if (!waitingForApproval) {
            return;
        }
        setCompState({ type: 'normal', messageContent: compState.messageContent });
        // TODO
        // textAreaRef.current?.focus();
    }

    function calculateTextAreaHeight(): number {
        // TODO
        // if (textAreaRef.current) {
        //     const textAreaRect = textAreaRef.current.getBoundingClientRect();
        //     return window.innerHeight - textAreaRect.top;
        // }
        return 170; // by default
    }

    return <div className={`flex flex-col relative border-t pt-4 pb-2 px-4 ${className}`}>
        {/* top bar */}
        <div className="flex flex-row px-4 mb-2">
            {/* top bar - revision icons */}
            <div className="flex flex-row">
                {defaultRevisions.map((icon, index) => {
                    // loading effect
                    if (compState.type === 'revising' && compState.revisingIndex === index) {
                        return <div className="p-1 mr-1 w-[28px]" key={index}>
                            <Oval height={17} width={17} color="#959595" secondaryColor="#959595" strokeWidth={4} strokeWidthSecondary={4} />
                        </div>;
                    }
                    // icon
                    return <div className="p-1 mr-1 w-[28px] bg-transparent hover:bg-gray-300 rounded" key={index}><button className="" key={index}
                        onClick={() => {
                            const ii = index;
                            startRevising(ii);
                        }}>{icon.iconNode}
                    </button></div>;
                })}
            </div>
        </div>

        {/* revision DiffView pop-up */}
        {
            // TODO 1. more appropriate max-width 2. line wrapping for content
            waitingForApproval && <DiffView className={`absolute w-fit min-w-[700px] max-w-[1000px] bg-white`} style={{ bottom: `${calculateTextAreaHeight()}px` }}
                originalText={messageContent} revisedText={compState.revisedText} allowFollowUpDiscussion={allowFollowUpDiscussion}
                approveRevisionCallback={approveRevision} rejectRevisionCallback={rejectRevision}
                startFollowUpDiscussion={(messageToRevise: string, revisedText: string) => {
                    setCompState({ type: 'normal', messageContent: '' });
                    // TODO
                    // textAreaRef.current?.focus();
                    startFollowUpDiscussion(compState.revisingInstruction, messageToRevise, revisedText);
                }} />}
        {/* message input area */}
        <TextInput allowEditing={isNormal} addMessage={addMesssage} />
    </div>;
}

function TextInput(
    { allowEditing: allowEdit, addMessage }: {
        allowEditing: boolean
        addMessage: (message: Message, opts: messageAddedCallbackOptions) => void;
    }
) {
    type typingOrVoiceMode = { type: 'typing' } | { type: 'voiceMode', autoSend: boolean };
    const [inputState, setInputState] = useState<
        | { type: 'noEdit' }
        | { type: 'typing' }
        | { type: 'voiceMode', autoSend: boolean }
        | { type: 'recording', recorder: IMediaRecorder, stream: MediaStream, previousState: typingOrVoiceMode }
        | { type: 'transcribing', previousState: typingOrVoiceMode }
    >({ type: 'typing' });
    const allowEditRef = useRef(allowEdit)
    useEffect(() => {
        if (!allowEdit) {
            setInputState({ type: 'noEdit' })
        }
        allowEditRef.current = allowEdit
    }, [allowEdit])
    const isTyping = inputState.type === 'typing'
    const isVoiceMode = inputState.type === 'voiceMode'
    const isRecording = inputState.type === 'recording'

    const [role, setRole] = useState<'system' | 'user' | 'assistant'>('user');
    const [showRoleMenu, setShowRoleMenu] = useState(false);

    const [msg, setMsg] = useState<TextMessage>(new TextMessage(role, ''));

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const recordBtnRef = useRef<HTMLButtonElement>(null);

    // inputState convertors
    function handleSend(msg: TextMessage, callbackOpts: messageAddedCallbackOptions = { generateAssistantMsg: true }) {
        if (inputState.type !== 'typing' && inputState.type !== 'voiceMode') return;
        if (msg.content.trim() === "") return;
        addMessage(msg, callbackOpts);
        setMsg(new TextMessage(role, ''));
        if (inputState.type === 'typing') {
            textAreaRef.current?.focus();
        }
    }
    const startRecording = async () => {
        if (inputState.type !== 'typing' && inputState.type !== 'voiceMode') {
            return
        }
        if (!MediaRecorder.isTypeSupported('audio/wav')) {
            await register(await connect());
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/wav' })
        setInputState(prev => ({ type: 'recording', recorder: recorder, stream: stream, previousState: prev as typingOrVoiceMode }))

        const audioChunks: Blob[] = []
        recorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data)
        })
        recorder.addEventListener("stop", () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
            startTranscribing(audioBlob, inputState)
        })
        recorder.start()
    }
    const stopRecording = async () => {
        if (inputState.type !== 'recording') {
            return
        }
        inputState.recorder.stop();
        // https://stackoverflow.com/questions/44274410/mediarecorder-stop-doesnt-clear-the-recording-icon-in-the-tab
        inputState.stream.getTracks().forEach(track => track.stop())
        setInputState({ type: 'transcribing', previousState: inputState.previousState })
    }
    const startTranscribing = (audioBlob: Blob, previousState: typingOrVoiceMode) => {
        const form = new FormData();
        form.append("model", "FunAudioLLM/SenseVoiceSmall");
        form.append("file", audioBlob, "recording.wav");
        const options = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
            },
            body: form
        };
        fetch('https://api.siliconflow.cn/v1/audio/transcriptions', options)
            .then(response => {
                response.json().then(data => {
                    const newMsg = msg.updateContent(msg.content + data.text);
                    setMsg(newMsg);
                    setInputState(previousState)
                    if (previousState.type === 'voiceMode' && previousState.autoSend) {
                        handleSend(newMsg)
                    }
                    if (previousState.type === 'typing') {
                        textAreaRef.current?.focus();
                    }
                });
            }).catch(err => {
                console.error(err);
                stopRecording();
            });
    };
    const enableVoiceMode = () => {
        if (inputState.type !== 'typing') return;
        setInputState({ type: 'voiceMode', autoSend: false })
        recordBtnRef.current?.focus();
    }
    const disableVoiceMode = () => {
        if (inputState.type !== 'voiceMode') return;
        setInputState({ type: 'typing' })
        textAreaRef.current?.focus();
    }
    const toggleAutoSend = () => {
        if (inputState.type !== 'voiceMode') return;
        setInputState({ type: 'voiceMode', autoSend: !inputState.autoSend })
    }

    return <div className="flex flex-col">
        {/* Text input and preview area */}
        <textarea
            className={`flex-1 p-4 resize-none focus:outline-none ${!isTyping && "cursor-default"}`}
            ref={textAreaRef}
            placeholder={isTyping ? `Type your message here...\n\nPress Enter to send, Ctrl+Enter to add the message, Shift+Enter to add a new line` : `Press Space to start recording, release to stop`}
            value={msg.content} onChange={(e) => setMsg(msg.updateContent(e.target.value))}
            readOnly={!isTyping}
            onKeyDown={(e) => {
                // TODO move this logic to MessageInput component
                defaultRevisions.forEach((icon) => {
                    if (icon.shortcutCallback && icon.shortcutCallback(e)) {
                        // const ii = i;
                        e.preventDefault();
                        // startRevising(ii);
                        return;
                    }
                });
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    handleSend(msg, { generateAssistantMsg: false });
                    return;
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(msg);
                    return;
                }
            }} rows={4} />
        {/* current message role */}
        <div className="flex flex-row p-1 px-3 mr-3 rounded-full hover:bg-gray-300 cursor-pointer" onClick={() => setShowRoleMenu(!showRoleMenu)}>
            <LuUserCog2 className="mr-2" size={25} /> <span className="font-bold">{role}</span>
            {showRoleMenu && (
                <div className="absolute mt-2 p-2 bg-white border border-gray-300 rounded shadow-lg">
                    {/* Add role options here */}
                    <div className="cursor-pointer hover:bg-gray-200 p-2" onClick={() => setRole('system')}>system</div>
                    <div className="cursor-pointer hover:bg-gray-200 p-2" onClick={() => setRole('assistant')}>assistant</div>
                    <div className="cursor-pointer hover:bg-gray-200 p-2" onClick={() => setRole('user')}>user</div>
                </div>
            )}
        </div>
        {/* Record button */}
        <div className="mt-2 flex items-center">
            <label className="flex items-center mr-4">
                <input
                    type="checkbox"
                    readOnly
                    checked={isVoiceMode
                        // while recording and transcribing, keep what was set before
                        || (inputState.type === 'recording' && inputState.previousState.type === 'voiceMode')
                        || (inputState.type === 'transcribing' && inputState.previousState.type === 'voiceMode')}
                    onClick={() => {
                        if (!isVoiceMode) { enableVoiceMode() } else { disableVoiceMode() }
                    }}
                    className="mr-2"
                />
                Voice Mode
            </label>
            <label className={`flex items-center ${!isVoiceMode && 'cursor-not-allowed'}`}>
                <input
                    type="checkbox"
                    readOnly
                    checked={isVoiceMode && inputState.autoSend
                        // while recording and transcribing, keep what was set before
                        || (inputState.type === 'recording' && inputState.previousState.type === 'voiceMode' && inputState.previousState.autoSend)
                        || (inputState.type === 'transcribing' && inputState.previousState.type === 'voiceMode' && inputState.previousState.autoSend)
                    }
                    onClick={toggleAutoSend}
                    className={`mr-2`}
                />
                Auto Send
            </label>
        </div>
        <button ref={recordBtnRef}
            className="mt-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            onClick={isRecording ? stopRecording : startRecording}
            onKeyDown={startRecording}
            onKeyUp={stopRecording}
        >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
    </div>
}

export function DiffView(
    { originalText, revisedText, approveRevisionCallback, rejectRevisionCallback, allowFollowUpDiscussion, startFollowUpDiscussion, style, className = "" }: {
        originalText: string;
        revisedText: string;
        allowFollowUpDiscussion: boolean;
        approveRevisionCallback: (revisedText: string) => void;
        rejectRevisionCallback: () => void;
        startFollowUpDiscussion: (messageToRevise: string, revisedText: string) => void;
        className?: string;
        style: object;
    }
) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.focus();
        }
    }, []);
    const changes = diffChars(originalText, revisedText);
    return (
        <div className={`p-4 pb-2 rounded-lg border-2 shadow-md focus:outline-none ${className}`} style={style}
            tabIndex={0} ref={containerRef}
            onKeyDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (e.key === 'Enter') {
                    approveRevisionCallback(revisedText);
                } else if (e.key === 'Backspace') {
                    rejectRevisionCallback();
                }
            }}>
            {changes.length > 0 && (
                <div className="flex flex-col relative">
                    {/* diff text */}
                    <div className="flex flex-wrap mb-4">
                        {changes.map((change, index) => (
                            <div key={index} className={`inline-block whitespace-pre-wrap break-words ${change.added ? 'bg-green-200' : change.removed ? 'bg-red-200 line-through text-gray-500' : ''}`}>
                                {/* TODO fix displaying line break issue */}
                                {change.value}
                                {/* <div className="w-full whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{
                                __html: change.value.replace(/\n/g, '<br />').replace(/ /g, '&nbsp;'),
                            }} /> */}
                            </div>
                        ))}
                    </div>
                    {/* buttons */}
                    <div className="flex flex-row self-end">
                        <button className="mr-2 py-0 px-2 bg-gray-800 rounded-md text-[12px] text-white" onClick={() => { approveRevisionCallback(revisedText); }}>
                            <PiKeyReturnBold className="inline-block mr-1" color="white" /> Approve
                        </button>
                        <button className="mr-2 py-0 px-1 rounded-lg text-[15px] text-gray-500" onClick={rejectRevisionCallback}>
                            <FaBackspace className="inline-block mr-1" color="6b7280" /> Reject
                        </button>
                        {allowFollowUpDiscussion && <button className="mr-2 py-0 px-1 rounded-lg text-[15px] text-gray-500"
                            onClick={() => startFollowUpDiscussion(originalText, revisedText)}>
                            <LiaComments className="inline-block mr-1" color="6b7280" /> Follow-up discussions
                        </button>}
                    </div>
                </div>
            )}

        </div>
    );
}

