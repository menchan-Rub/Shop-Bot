const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * スラッシュコマンドを登録する
 * @param {Object} client - Discordクライアント
 * @returns {Promise<void>}
 */
async function registerCommands(client) {
  try {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    // コマンドファイルの読み込み
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        logger.info(`コマンドを登録対象に追加: ${command.data.name}`);
      } else {
        logger.warn(`コマンド ${file} には必要なプロパティがありません`);
      }
    }
    
    // REST APIの設定
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    // コマンドの登録
    if (commands.length > 0) {
      logger.info(`${commands.length}個のコマンドを登録中...`);
      
      // グローバルコマンドとして登録する場合
      if (process.env.NODE_ENV === 'production') {
        await rest.put(
          Routes.applicationCommands(process.env.CLIENT_ID),
          { body: commands }
        );
        logger.info('グローバルコマンドとして登録しました');
      } 
      // 特定のサーバーにのみ登録する場合（開発環境など）
      else {
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: commands }
        );
        logger.info(`サーバー ${process.env.GUILD_ID} にコマンドを登録しました`);
      }
    } else {
      logger.warn('登録するコマンドがありません');
    }
  } catch (error) {
    logger.error(`コマンド登録エラー: ${error}`);
  }
}

module.exports = { registerCommands }; 