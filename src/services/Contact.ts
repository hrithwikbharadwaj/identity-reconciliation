import prisma from "../../prisma/prisma-client"
import { Contact, ContactResponse, LinkPrecedence } from "../models/Contact";
import HttpException from "../models/HttpException";

export const getContactDetails = async (email?: string, phoneNumber?: string) => {
    const records = await prisma.contact.findMany({
        where: {
            OR: [
                { email },
                { phoneNumber }
            ]
        }
    }) as Contact[];
    if (!records?.length) {
        const newContact = await createContact(email, phoneNumber);
        return { contact: formIdentityResponse([newContact]) };
    }
    await addRemainingRecords(records);
    const sortedRecords = records.sort((current, next) => current.createdAt.getTime() - next.createdAt.getTime());
    await updatePrimaryToSecondary(sortedRecords);
    await addContactIfNew(sortedRecords, email, phoneNumber);
    return { contact: formIdentityResponse(sortedRecords) };
}

export const validateInputs = (email: string, phoneNumber: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
        throw new HttpException(400, 'Provide Valid Email');
    }
    if (!email && !phoneNumber) {
        throw new HttpException(400, 'Provide email or phoneNumber');
    }
}

const findPrimaryAndAllSecondaryRecords = async (id: number, contactIds: number[]) => {
    return await prisma.contact.findMany({
        where: {
            AND: {
                OR: [
                    {
                        id
                    },
                    {
                        linkedId: id
                    }
                ],
                id: {
                    not: {
                        in: contactIds
                    }
                }
            }
        }
    });
}

const findAllSecondaryRecords = async (id: number, contactIds: number[]) => {
    return await prisma.contact.findMany({
        where: {
            AND: {
                linkedId: id,
                id: {
                    not: {
                        in: contactIds
                    }
                }
            }
        }
    });
}

const addRemainingRecords = async (contacts: Contact[]) => {
    const firstContact = contacts[0];
    const contactIds = contacts.map(({ id }) => id);
    if (firstContact.linkPrecedence === LinkPrecedence.SECONDARY) {
        const id = firstContact.linkedId;
        const records = await findPrimaryAndAllSecondaryRecords(id, contactIds) as Contact[];
        contacts.push(...records);
        return;
    }
    const id = firstContact.id;
    const records = await findAllSecondaryRecords(id, contactIds) as Contact[];
    contacts.push(...records);
}

const addContactIfNew = async (records:Contact[], email?: string, phoneNumber?: string) => {
    const primaryRecordId = records[0].id;
    const uniqueEmailIds = [...new Set(records.map(record => record.email))] as string[];
    const uniquePhoneNumbers = [...new Set(records.map(record => record.phoneNumber))] as string[];
    const isNewEmail = !!email && !uniqueEmailIds.includes(email);
    const isNewPhoneNumber = !!phoneNumber && !uniquePhoneNumbers.includes(phoneNumber);


    if (isNewEmail || isNewPhoneNumber) {
        const newContact = await prisma.contact.create({
            data: {
                phoneNumber,
                email,
                linkedId: primaryRecordId,
                linkPrecedence: LinkPrecedence.SECONDARY
            }
        }) as Contact;
        records.push(newContact);
    }
}

// checks whether the secondaryContacts are primary and updates them to primary and refrences it with primarycontactId
const updatePrimaryToSecondary = async (sortedRecords: Contact[]) => {
    const primaryContactId = sortedRecords[0].id;
    const secondaryContacts = sortedRecords.slice(1);

    const primaryContactIds = secondaryContacts
        .filter((contact) => contact.linkPrecedence === LinkPrecedence.PRIMARY)
        .map((contact) => contact.id);

    const primaryContactExists = !!primaryContactIds.length;
    
    if (primaryContactExists) {
        await prisma.contact.updateMany({
            where: {
                id: {
                    in: primaryContactIds,
                },
            },
            data: {
                linkPrecedence: LinkPrecedence.SECONDARY,
                linkedId: primaryContactId,
            },
        });
    }
};

const formIdentityResponse = (contacts:Contact[]) => {
    const response: ContactResponse = {
        primaryContactId: contacts[0].id,
        emails: [],
        phoneNumbers: [],
        secondaryContactIds: []
    };
    contacts.forEach((contact) => {
        if (contact.email && !response.emails.includes(contact.email)) {
            response.emails.push(contact.email)
        }
        if (contact.phoneNumber && !response.phoneNumbers.includes(contact.phoneNumber)) {
            response.phoneNumbers.push(contact.phoneNumber)
        }
        if (contact.id !== response.primaryContactId) {
            response.secondaryContactIds.push(contact.id);
        }
    });
    return response;
}

const createContact = async (email?: string, phoneNumber?: string) => {
    const user = await prisma.contact.create({
        data: {
            email: email,
            phoneNumber: phoneNumber,
            linkPrecedence: LinkPrecedence.PRIMARY
        }
    });
    return user as Contact;

}