FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY index.js .

RUN npm install

ENV PORT=3000
ENV JWT_SECRET_KEY=secret

EXPOSE 3000

CMD ["node", "index.js"]
