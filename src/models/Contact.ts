export interface Contact {
    id: Number;
    phoneNumber?: string;
    email?: string;
    linkedId: Number;
    linkPrecedence: Precedence.PRIMARY | Precedence.SECONDARY;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

export enum Precedence {
    SECONDARY = "secondary",
    PRIMARY = "primary"
}

export interface ContactResponse {
    primaryContactId: Number;
    emails: Array<string>,
    phoneNumbers: Array<string>,
    secondaryContactIds: Array<number>
}