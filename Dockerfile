FROM node:22-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATA_DIR=/data

WORKDIR /app
RUN apk add --no-cache su-exec
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node lib ./lib
COPY --chown=node:node scripts ./scripts
COPY docker-entrypoint.sh /usr/local/bin/yurim-entrypoint
RUN mkdir -p /data && chown node:node /data && chmod 700 /data
RUN chmod 755 /usr/local/bin/yurim-entrypoint

# Entry point initializes the mount directory, then execs the server as node.
USER root
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/yurim-entrypoint"]
CMD ["node", "server.mjs"]
