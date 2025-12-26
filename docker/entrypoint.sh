#!/bin/sh

# Start Hardhat node in the background
echo "Starting local blockchain node..."
npx hardhat node --hostname 0.0.0.0 &

# Wait for node to initialize
sleep 5

# Deploy contracts
echo "Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

# Keep container alive to allow interaction via RPC
echo "Node is running at http://0.0.0.0:8545"
wait