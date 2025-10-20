# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose the port your service runs on
EXPOSE 3001

# Start your application
CMD ["node", "server.js"]
