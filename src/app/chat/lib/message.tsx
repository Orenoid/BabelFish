
export abstract class Message {
    type: string
    role: string
    className: string

    constructor(type: string, role: string, className: string = "") {
        this.type = type
        this.role = role
        this.className = className
    }

    // This method is responsible for rendering the message component. 
    // It returns a ReactNode or null if the message should not be displayed.
    abstract render(): ({}: {className?: string}) => JSX.Element

    // return the json object for chat completion api request
    // if it returns null, then the message won't be included in the request
    abstract toJSON(): {role: string, content: string} | null
}