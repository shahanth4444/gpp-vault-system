FROM node:18-alpine

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Grant execution permission to entrypoint
RUN chmod +x ./docker/entrypoint.sh

# Expose RPC port
EXPOSE 8545

# Start
ENTRYPOINT ["./docker/entrypoint.sh"]