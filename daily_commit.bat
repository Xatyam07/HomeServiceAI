@echo off

cd /d "C:\Users\Desktop\HomeServiceAI"

echo %date% %time%>> activity.txt

git add activity.txt

git commit -m "chore: daily contribution"

git push origin main