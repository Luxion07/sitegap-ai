# Development image only — it runs `next dev`, not a production build.
# A multi-stage production image (build + standalone runner) is added when
# there is a deployment target. See SPEC §24 / §25.
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["pnpm", "dev"]