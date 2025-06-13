FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY . .
WORKDIR /app/backend
ENV PORT=3000
CMD ["node", "index.js"]
