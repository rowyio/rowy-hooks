# STAGE 1
FROM node:16-alpine as builder
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
RUN npm config set unsafe-perm true
RUN npm install -g typescript
RUN npm install -g ts-node
#USER node
RUN npm install
COPY --chown=node:node . .
RUN npm run build

# STAGE 2
FROM node:16-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
# USER node
RUN npm install --production
COPY --from=builder /home/node/app/build ./build

EXPOSE 8080
CMD [ "node", "build/src/index.js" ]
