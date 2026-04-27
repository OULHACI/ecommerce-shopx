#!/bin/bash
echo "🚀 Starting ShopX E-Commerce..."

# Start backend
echo "📦 Starting Flask backend on port 5000..."
cd backend
pip install -r requirements.txt -q
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 2

# Start frontend
echo "⚡ Starting React frontend on port 5173..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ ShopX is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Demo accounts:"
echo "   Admin:  admin@shop.com / admin123"
echo "   Seller: seller@shop.com / seller123"
echo "   Client: client@shop.com / client123"
echo ""
echo "Press Ctrl+C to stop..."

wait
