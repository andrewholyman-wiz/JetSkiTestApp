# Multi-stage production build — zero Node.js runtime in final container
FROM mirror.gcr.io/library/node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund --ignore-scripts

COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

# Hardened non-root Nginx serving static bundle on port 8080 (PSS Restricted compatible)
FROM mirror.gcr.io/library/nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN mkdir -p /etc/nginx/auth \
    && chown -R 101:101 /usr/share/nginx/html /etc/nginx/nginx.conf /etc/nginx/auth

USER 101:101
EXPOSE 8080

ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]
