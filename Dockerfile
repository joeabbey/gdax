FROM node:7

RUN ln -fs /usr/share/zoneinfo/Etc/GMT+5 /etc/localtime
RUN date

RUN npm init -y
RUN npm install gdax blessed blessed-contrib sprintf-js date-utils optional-require

RUN mkdir /app/

#Be sure to copy over config.js.example to config.js!!
ADD *.js /app/ 

WORKDIR /app/
ENV LANG en_US.utf8 
ENV TERM xterm-256color 
ENTRYPOINT node index.js
