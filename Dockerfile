# # Use an official Node.js runtime as a parent image
# FROM node:18

# # Set the working directory in the container
# WORKDIR /wbl-resume-backend

# # Copy package.json and package-lock.json to the working directory
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Install necessary libraries for Puppeteer
# RUN apt-get update && apt-get install -y \
#     apt-transport-https \
#     ca-certificates \
#     curl \
#     fonts-liberation \
#     gconf-service \
#     libappindicator1 \
#     libasound2 \
#     libatk1.0-0 \
#     libatk-bridge2.0-0 \
#     libcups2 \
#     libdbus-1-3 \
#     libdrm2 \
#     libgbm1 \
#     libglib2.0-0 \
#     libgtk-3-0 \
#     libnspr4 \
#     libnss3 \
#     libx11-xcb1 \
#     libxcomposite1 \
#     libxdamage1 \
#     libxext6 \
#     libxfixes3 \
#     libxrandr2 \
#     libxtst6 \
#     lsb-release \
#     wget \
#     xdg-utils \
#     --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/*

# # Copy the rest of the application code to the working directory
# COPY . .

# # Expose the ports the app runs on
# EXPOSE 8001
# EXPOSE 8002

# # Command to run the app
# CMD ["npm", "start"]



# # Use an official Node.js runtime as a parent image
# FROM node:18

# # Set the working directory in the container
# WORKDIR /wbl-resume-backend

# # Copy package.json and package-lock.json to the working directory
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Install necessary libraries for Puppeteer
# RUN apt-get update && apt-get install -y \
#     apt-transport-https \
#     ca-certificates \
#     curl \
#     fonts-liberation \
#     gconf-service \
#     libappindicator1 \
#     libasound2 \
#     libatk1.0-0 \
#     libatk-bridge2.0-0 \
#     libcups2 \
#     libdbus-1-3 \
#     libdrm2 \
#     libgbm1 \
#     libglib2.0-0 \
#     libgtk-3-0 \
#     libnspr4 \
#     libnss3 \
#     libx11-xcb1 \
#     libxcomposite1 \
#     libxdamage1 \
#     libxext6 \
#     libxfixes3 \
#     libxrandr2 \
#     libxtst6 \
#     lsb-release \
#     wget \
#     xdg-utils \
#     --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/*

# # Install pm2 globally
# RUN npm install pm2 -g

# # Copy the rest of the application code to the working directory
# COPY . .

# # Expose the ports the app runs on
# EXPOSE 8001
# EXPOSE 8002

# # Use pm2 to run both app.js and server.js
# CMD ["pm2-runtime", "start", "pm2.json"]



# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /wbl-resume-backend

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Install necessary libraries for Puppeteer
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    fonts-liberation \
    gconf-service \
    libappindicator1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code to the working directory
COPY . .

# Expose the ports the app runs on
EXPOSE 8001
EXPOSE 8002

# Run parent.js using Node.js
CMD ["node", "parent.js"]
