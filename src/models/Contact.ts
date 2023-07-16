export interface Contact {
    id: number;
    phoneNumber?: string;
    email?: string;
    linkedId: number;
    linkPrecedence: LinkPrecedence.PRIMARY | LinkPrecedence.SECONDARY;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

export enum LinkPrecedence {
    SECONDARY = "secondary",
    PRIMARY = "primary"
}

export interface ContactResponse {
    primaryContactId: Number;
    emails: string[],
    phoneNumbers: string[],
    secondaryContactIds: number[]
}