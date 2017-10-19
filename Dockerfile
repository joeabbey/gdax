FROM node:7

RUN npm init -y
RUN npm install gdax blessed blessed-contrib sprintf-js

RUN mkdir /app/
ADD index.js /app/
ADD config.js /app/ #Copy over config.js.example 

WORKDIR /app/
ENV LANG en_US.utf8 
ENV TERM xterm-256color 
ENTRYPOINT node index.js
