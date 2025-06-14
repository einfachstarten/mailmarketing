FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY . .
WORKDIR /app/backend
ENV PORT=8080
CMD ["node", "index.js"]
