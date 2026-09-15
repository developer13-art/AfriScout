FROM apify/actor-node-playwright-chrome:20

# Copy package manifests first so dependency installation is cached
COPY --chown=myuser:myuser package*.json ./

# Install all dependencies (including dev) so we can compile TypeScript
RUN npm install --include=dev --omit=optional

# Copy the rest of the source
COPY --chown=myuser:myuser . ./

# Compile TypeScript to dist/
RUN npm run build

# Strip dev dependencies from the final image
RUN npm prune --omit=dev

CMD npm start --silent