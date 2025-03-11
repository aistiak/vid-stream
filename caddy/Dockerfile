# Dockerfile
FROM caddy:2-builder AS builder

# Install xcaddy and build Caddy with the caddy-auth-portal plugin
RUN xcaddy build --with github.com/greenpau/caddy-auth-portal

FROM caddy:2

# Copy the custom Caddy binary from the builder stage
COPY --from=builder /usr/bin/caddy /usr/bin/caddy