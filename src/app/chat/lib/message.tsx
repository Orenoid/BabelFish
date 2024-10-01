
export abstract class Message {
    type: string
    role: string
    displayToUser: boolean
    includedInChatCompletion: boolean
    className: string

    constructor(
        type: string, role: string,
        displayToUser: boolean = true,
        includedInChatCompletion: boolean = true,
        className: string = ""
    ) {
        this.type = type
        this.role = role
        this.className = className
        this.displayToUser = displayToUser
        this.includedInChatCompletion = includedInChatCompletion
    }

    // This method is responsible for rendering the message component. 
    abstract render(): ({ }: {
        className?: string
    }) => JSX.Element

    // return the json object of this message as part of chat completion api request
    abstract toJSON(): { role: string, content: string }
}