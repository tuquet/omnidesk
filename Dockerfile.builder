FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Update and install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    build-essential \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libwebkit2gtk-4.1-dev \
    mingw-w64 \
    nsis \
    zip \
    unzip \
    git \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js v20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install PNPM
RUN npm install -g pnpm@9.15.0

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Add Windows GNU target for cross-compilation
RUN rustup target add x86_64-pc-windows-gnu

# Configure Cargo for cross-compilation
RUN mkdir -p /root/.cargo && \
    echo "[target.x86_64-pc-windows-gnu]" > /root/.cargo/config.toml && \
    echo "linker = \"x86_64-w64-mingw32-gcc\"" >> /root/.cargo/config.toml

# Set working directory
WORKDIR /app

# The entrypoint will be provided by a shell script mounted from the host
# This script will run pnpm install and execute the correct build command
COPY scripts/docker-build.sh /usr/local/bin/docker-build.sh
RUN chmod +x /usr/local/bin/docker-build.sh

ENTRYPOINT ["/usr/local/bin/docker-build.sh"]
