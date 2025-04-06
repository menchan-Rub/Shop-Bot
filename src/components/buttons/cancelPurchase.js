const logger = require('../../utils/logger');

module.exports = {
  customId: 'cancel_purchase',
  
  async execute(interaction) {
    try {
      await interaction.update({
        content: '購入をキャンセルしました。',
        components: [],
        embeds: [],
        ephemeral: true
      });
    } catch (error) {
      logger.error(`購入キャンセルボタンエラー: ${error}`);
      await interaction.update({
        content: `エラーが発生しました: ${error.message}`,
        components: [],
        embeds: [],
        ephemeral: true
      });
    }
  }
}; 