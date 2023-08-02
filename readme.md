# Identity- R**econciliation**

An Open Source API which consolidates user data who has signed up using different emailid and phone number into single record.

## Usage

Make a POST Request to this [URL](https://bitespeed.tapthe.link/api/identify) with the sample request body below.

```jsx
{
    "phoneNumber": "898",
    "email": "hey@example.com"
}
```

This will reconcile data and return data in this format.

```jsx
{
    "contact": {
        "primaryContactId": 1,
        "emails": [
            "hey@example.com"
        ],
        "phoneNumbers": [
            "898",
        ],
        "secondaryContactIds": [
           2
        ]
    }
}
```

## Local Setup

1. Install Node Modules 

```jsx
npm i
```

2. Setup a [Planet Scale Database](https://planetscale.com/) and paste the database url which planetscale gives you in the .env file (refer to .env.example and required things)
3. Run Prisma Migration (This will Create the database from the prisma schema if it’s not already created)

```jsx
npx prisma migrate dev
```
4. Run the Server

```jsx
npm run dev
```

## Try it with Docker

The app is dockerised and you can run the below command to get the app running.
```
docker compose up -d
```
## Deploy it to Cloud

If you are planning to deploy this service in AWS EC2 Machine.

1. Transpile TS code to JS Code using build command

```jsx
npm run build
```

2. Use PM2 to run the transpiled code 

```jsx
pm2 start dist/src/index.js -i max
```

## Tech Stack

- Node.Js + Typescript
- Prisma(ORM) + PlanetScale (DB)

Here is my [Resume](https://drive.google.com/file/d/1A_Zdtvv1t_Wl3sUylN2O2Sy8A3bVhTFN/view?usp=sharing)