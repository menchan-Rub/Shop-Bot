const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const { registerCommands } = require('../utils/commandDeployer');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      logger.info(`Botが起動しました！ログイン名: ${client.user.tag}`);
      
      // プレゼンスの設定
      client.user.setPresence({
        activities: [{ name: 'ショップを管理中', type: ActivityType.Playing }],
        status: 'online',
      });
      
      // スラッシュコマンドの登録
      await registerCommands(client);
      
      // 起動メッセージ
      logger.info('すべての準備が完了しました！ショップボットは正常に稼働中です。');
    } catch (error) {
      logger.error(`起動時エラー: ${error}`);
    }
  },
}; 