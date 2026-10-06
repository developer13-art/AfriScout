FROM apify/actor-node:20

COPY --chown=myuser:myuser package*.json ./
RUN npm install --omit=dev --omit=optional

COPY --chown=myuser:myuser . ./
RUN npm run build

CMD npm start --silent