# For PROD only

FROM node:23.10.0
WORKDIR /usr/src/aivocate-node
COPY ["package*.json", "yarn.lock", "./"]
RUN yarn install --frozen-lockfile
COPY . .
# RUN yarn back:build
RUN yarn front:build
EXPOSE 8000
CMD ["yarn", "start"]
