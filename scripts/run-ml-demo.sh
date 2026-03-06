#!/bin/bash

# ML Classification Demo Script
source ~/.nvm/nvm.sh
nvm use

echo "🚀 Starting ML Classification Demo..."
echo "=================================="

# Run the demonstration
npx ts-node src/demo/ml-classification-demo.ts

echo ""
echo "🎉 Demo completed!"
echo "📁 Check for saved model at: ./demo-model"
echo "📊 Check for any generated output files"
