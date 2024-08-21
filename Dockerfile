# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the project dependencies
RUN npm install --production

# Copy the rest of the application files into the container
COPY . .

# Expose port 3005 to the outside world
EXPOSE 5001

# Define the command to run your application
CMD ["node", "app.js"]
