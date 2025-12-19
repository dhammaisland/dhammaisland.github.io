# 法洲
分享佛法智慧与修行资源
https://dhammaisland.online

## 启动web服务
python3 -m http.server 8080

## 从daily_dhamma.json同步最新的dhamma到dhamma.json和dhamma.js
python3 /home/hongda/src/dhammaisland.github.io/sync_dhamma.py

## 更新css
npx @tailwindcss/cli -i ./src/input.css -o ./dist/output.css --minify