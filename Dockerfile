FROM node:lts-slim

WORKDIR /app
COPY ./ ./
RUN npm install discord.js @discordjs/voice

CMD [ "node", "bot.js" ]