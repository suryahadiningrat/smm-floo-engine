# Use Node.js 20 LTS
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 3018

# Define environment variables (can be overridden by docker-compose)
ENV PORT=3018

# Start the application
CMD [ "node", "server.js" ]
