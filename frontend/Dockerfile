FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Add environment arguments with defaults
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
# Increase Node memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add runtime environment variables script
RUN echo "#!/bin/sh" > /docker-entrypoint.d/40-env-subst.sh && \
    echo "envsubst '\${REACT_APP_API_URL}' < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js" >> /docker-entrypoint.d/40-env-subst.sh && \
    chmod +x /docker-entrypoint.d/40-env-subst.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]