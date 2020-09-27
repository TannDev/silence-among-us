
FROM node:12-alpine
WORKDIR /home/app

# Set up the dependencies
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install

# Copy everything else.
COPY . .

# Expose the app port, by default.
EXPOSE 3000

# By default, run everything.
CMD ["npm", "start"]
