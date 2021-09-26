FROM node:14-alpine

WORKDIR /opt/mre

ENV PORT=80
ENV BASE_URL=http://quizshowaltspacevr.eu.openode.io/

# daemon for cron jobs
RUN echo 'crond' > /boot.sh
# RUN echo 'crontab .openode.cron' >> /boot.sh

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

# COPY package*.json ./

# RUN npm install --production

# # Bundle app source
# COPY . .

# CMD sh /boot.sh && npm start

COPY package*.json ./
RUN ["npm", "install", "--unsafe-perm"]

COPY tsconfig.json ./
COPY src ./src/
RUN ["npm", "run", "build-only"]

COPY public ./public/

EXPOSE 3901/tcp
CMD sh /boot.sh && npm start