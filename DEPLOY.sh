#!/bin/bash

# Deployment script for generate-content edge function

echo "🚀 Deploying generate-content edge function to Supabase..."
echo ""

# Check if logged in
echo "Step 1: Checking Supabase authentication..."
cd frontend

# Try to deploy (will prompt for login if needed)
echo ""
echo "Step 2: Deploying function..."
npx supabase functions deploy generate-content --project-ref qkqqajnawatqxjmuecsw

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Function deployed successfully!"
    echo ""
    echo "⚠️  IMPORTANT: Don't forget to set your ANTHROPIC_API_KEY secret!"
    echo ""
    echo "Run this command:"
    echo "  npx supabase secrets set ANTHROPIC_API_KEY=your_key_here --project-ref qkqqajnawatqxjmuecsw"
    echo ""
    echo "Or set it via the dashboard:"
    echo "  https://supabase.com/dashboard/project/qkqqajnawatqxjmuecsw/settings/functions"
else
    echo ""
    echo "❌ Deployment failed. You may need to login first:"
    echo "  cd frontend && npx supabase login"
    echo ""
    echo "Then run this script again."
fi
