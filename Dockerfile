FROM node:22-alpine

RUN apk add --no-cache python3 make g++ && \
    corepack enable && \
    corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node_modules/.bin/tsx", "server.ts"]
