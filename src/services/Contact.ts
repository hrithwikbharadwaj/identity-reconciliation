import prisma from "../../prisma/prisma-client"
import { Contact, ContactResponse, LinkPrecedence } from "../models/Contact";
// import { PrismaClient } from '@prisma/client'

export const getContactDetails = async (email?: string, phoneNumber?: string) => {
    const records = await prisma.contact.findMany({
        where: {
            OR: [
                { email },
                { phoneNumber }
            ]
        }
    });
    if (!records?.length) {
        const newContact = await createContact(email, phoneNumber);
        return { contact: formIdentityResponse([newContact]) };
    }
    await addRemainingRecords(records, email, phoneNumber);
    const sortedRecords = records.sort( (a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    await addContactIfNotExists(sortedRecords, email, phoneNumber);
    return { contact: formIdentityResponse(sortedRecords) };
}

const addRemainingRecords = async(records:Array<any>, email?:string, phoneNumber?:string)=>{
    const firstRecord = records[0];

    const recordsMap = records.reduce((map, record)=> {
        map[record.id] = record;
        return map;
    }, {});

    if(firstRecord.linkPrecedence === LinkPrecedence.SECONDARY){
        const id = firstRecord.linkedId;
        const data = await prisma.contact.findMany({
            where: {
               OR: [
                {
                    id
                },
                {
                    linkedId: id
                }
               ]
            }
        });
        const filteredData = data.filter( record => !recordsMap[record.id]);
        records.unshift(...filteredData);
        // can sort the records again
    }
    else if(firstRecord.linkPrecedence === LinkPrecedence.PRIMARY){
        const id = firstRecord.id;
        const data = await prisma.contact.findMany({
            where: {
                linkedId: id
            }
        });
        const filteredData = data.filter( record => !recordsMap[record.id]);
        records.push(...filteredData);
    }
}

const addContactIfNotExists = async (records: Array<any>, email?: string, phoneNumber?: string) => {
    const existingRecord = records.find(record => record.email === email || record.phoneNumber === phoneNumber);
    const primaryRecord = records.find(record => record.linkPrecedence === LinkPrecedence.PRIMARY);
    const exactRecord = records.find(record => record.email === email && record.phoneNumber === phoneNumber);

    if (exactRecord || existingRecord.email === email && existingRecord.phoneNumber === phoneNumber) {
        // do nothing
        return;
    }
    else if (email && phoneNumber && (existingRecord.email === email || existingRecord.phoneNumber === phoneNumber)) {
        const newContact = await prisma.contact.create({
            data: {
                phoneNumber,
                email,
                linkedId: primaryRecord.id,
                linkPrecedence: "secondary"
            }
        });
        records.push(newContact);
    }
}

const formIdentityResponse = (contacts: Array<any>) => {
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
        if(contact.id !== response.primaryContactId){
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