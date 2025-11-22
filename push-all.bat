@echo off
echo --- Pushing Backend ---
cd Backend
git add .
git commit -m "Backend update" || echo "No backend changes"
git pull origin main --rebase
git push origin main

echo --- Pushing Frontend ---
cd ../Frontend
git add .
git commit -m "Frontend update" || echo "No frontend changes"
git pull origin main --rebase
git push origin main

echo --- DONE ---
pause
