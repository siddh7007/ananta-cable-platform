FROM node:20-alpine
WORKDIR /app
COPY . .
RUN corepack enable && pnpm i && pnpm run build
EXPOSE 8080
CMD ["node","dist/index.js"]
