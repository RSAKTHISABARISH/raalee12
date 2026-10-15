# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG PUBLIC_API_BASE
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE
RUN npm run build

# Runtime stage
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4321"]
