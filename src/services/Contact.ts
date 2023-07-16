import prisma from "../../prisma/prisma-client"
import { Contact, ContactResponse, Precedence } from "../models/Contact";
// import { PrismaClient } from '@prisma/client'

export const getContactDetails = async (email?: string, phoneNumber?: string) => {
    const data = await prisma.contact.findMany({
        where: {
            OR: [
                { email },
                { phoneNumber }
            ]
        }
    });
    if (!data?.length) {
        const newContact = await createContact(email, phoneNumber);
        return { contact: formIdentityResponse([newContact]) };
    }
    return { contact: formIdentityResponse(data) };
}

const formIdentityResponse = (contacts: Array<any>) => {
    const response: ContactResponse = {
        primaryContactId: contacts[0].id,
        emails: [],
        phoneNumbers: [],
        secondaryContactIds: []
    };
    contacts.forEach((contact) => {
        if (contact.email) {
            response.emails.push(contact.email)
        }
        if (contact.phoneNumber) {
            response.phoneNumbers.push(contact.phoneNumber)
        }
    });
    return response;
}

const createContact = async (email?: string, phoneNumber?: string) => {
    const user = await prisma.contact.create({
        data: {
            email: email,
            phoneNumber: phoneNumber,
            linkPrecedence: Precedence.PRIMARY
        }
    });
    return user as Contact;

}