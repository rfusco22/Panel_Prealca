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
# La zona del contenedor es UTC por defecto. Se fija a la de la planta para que
# los logs y cualquier hora del proceso coincidan con lo que ve el usuario. El
# calculo de fechas de negocio no depende de esto (ver ZONA_HORARIA en
# lib/fecha.ts), pero tenerlas alineadas evita confusiones al depurar.
ENV TZ=America/Caracas

CMD ["node_modules/.bin/tsx", "server.ts"]
