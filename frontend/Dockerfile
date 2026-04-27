FROM node:18-alpine as builder
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments and environment
ARG VITE_API_URL=http://192.168.50.39
ENV VITE_API_URL=$VITE_API_URL

# Create .env file for Vite
RUN echo "VITE_API_URL=$VITE_API_URL" > .env

# Build the application with verbose output
RUN npm run build -- --mode production

# Production stage
FROM nginx:stable-alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
