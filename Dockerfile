FROM node:7

RUN npm init -y
RUN npm install gdax blessed blessed-contrib sprintf-js

RUN mkdir /app/
ADD index.js /app/

#Be sure to copy over config.js.example to config.js!!
ADD config.js /app/ 

WORKDIR /app/
ENV LANG en_US.utf8 
ENV TERM xterm-256color 
ENTRYPOINT node index.js
