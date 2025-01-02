# Use an official Node runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Install serve to run the app
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the app
CMD ["serve", "-s", "build", "-l", "8080"]
