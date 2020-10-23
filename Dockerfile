
FROM node:14-alpine
WORKDIR /home/app

# Set up the dependencies
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install

# Copy everything else.
COPY . .

# By default, run everything.
CMD ["npm", "start"]
