FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install formidable form-data --save

# アップロード画像表示用のディレクトリを作成
RUN mkdir -p public/uploads

COPY . .

# 開発モードで実行
EXPOSE 3000

# 開発サーバーを起動（ビルドせずに直接開発モードで実行）
CMD ["npm", "run", "dev"] 