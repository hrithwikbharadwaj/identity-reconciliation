export interface Contact {
    id: Number;
    phoneNumber?: string;
    email?: string;
    linkedId: Number;
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
    emails: Array<string>,
    phoneNumbers: Array<string>,
    secondaryContactIds: Array<number>
}