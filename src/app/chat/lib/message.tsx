
export abstract class Message {
    type: string
    role: string
    displayToUser: boolean
    includedInChatCompletion: boolean

    constructor(
        type: string, role: string,
        displayToUser: boolean = true,
        includedInChatCompletion: boolean = true,
    ) {
        this.type = type
        this.role = role
        this.displayToUser = displayToUser
        this.includedInChatCompletion = includedInChatCompletion
    }

    // This method is responsible for rendering the message component. 
    abstract render(): ({ }: {
        updateMessage: (message: Message) => void,
        className?: string
    }) => JSX.Element

    // This method is responsible for serializing the message object into a string format.
    abstract serialize(): string

    // This method is responsible for deserializing the message object from a string format.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static deserialize(serialized: string): Message {
        throw new Error("Deserialization not implemented for this message type");
    }

    abstract isEmpty(): boolean
    
    // return the json object of this message as part of chat completion api request
    abstract toJSON(): { role: string, content: string }
}