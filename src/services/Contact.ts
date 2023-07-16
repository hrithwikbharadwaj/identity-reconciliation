import prisma from "../../prisma/prisma-client"
import { Contact, ContactResponse, LinkPrecedence } from "../models/Contact";

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
    const sortedRecords = records.sort( (current, next) => current.createdAt.getTime() - next.createdAt.getTime());
    const primaryRecordId = sortedRecords[0].id as number;
    await checkAndUpdateRecordsToSecondary(sortedRecords.slice(1), primaryRecordId);
    await addContactIfNotExists(sortedRecords, email, phoneNumber);
    return { contact: formIdentityResponse(sortedRecords) };
}

const addRemainingRecords = async(contacts:Array<any>, email?:string, phoneNumber?:string)=>{
    const firstContact = contacts[0];

    const recordsMap = contacts.reduce((map, contact)=> {
        map[contact.id] = contact;
        return map;
    }, {});

    if(firstContact.linkPrecedence === LinkPrecedence.SECONDARY){
        const id = firstContact.linkedId;
        // find the primary record and the all the secondary records.
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
        contacts.push(...filteredData);
    }
    else if(firstContact.linkPrecedence === LinkPrecedence.PRIMARY){
        const id = firstContact.id;
        // find all the secondary records for the primary record
        const data = await prisma.contact.findMany({
            where: {
                linkedId: id
            }
        });
        const filteredData = data.filter( record => !recordsMap[record.id]);
        contacts.push(...filteredData);
    }
}

const addContactIfNotExists = async (records: Array<any>, email?: string, phoneNumber?: string) => {
    const primaryRecord = records.find(record => record.linkPrecedence === LinkPrecedence.PRIMARY);
    const uniqueEmailIds = [...new Set(records.map(record => record.email))] as string[];
    const uniquePhoneNumbers = [...new Set(records.map(record => record.phoneNumber))] as string[];
    const isNewEmail = !!email && !uniqueEmailIds.includes(email);
    const isNewPhoneNumber = !!phoneNumber && !uniquePhoneNumbers.includes(phoneNumber);


    if (isNewEmail || isNewPhoneNumber) {
        const newContact = await prisma.contact.create({
            data: {
                phoneNumber,
                email,
                linkedId: primaryRecord.id,
                linkPrecedence: LinkPrecedence.SECONDARY
            }
        });
        records.push(newContact);
    }
}

const checkAndUpdateRecordsToSecondary = async (secondaryContacts:any[], primaryContactId:number) => {
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