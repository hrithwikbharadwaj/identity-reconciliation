FROM node:16

WORKDIR /app

COPY package*.json ./




# RUN npm install -g pm2

COPY . .
RUN npm install 
RUN npx prisma generate
EXPOSE 5000


CMD ["npm", "run", "start"]
