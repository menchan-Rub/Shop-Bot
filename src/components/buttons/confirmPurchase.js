const logger = require('../../utils/logger');
const buyCommand = require('../../commands/buy');

module.exports = {
  customId: 'confirm_purchase_',
  
  async execute(interaction) {
    try {
      // カスタムIDから商品IDと数量を抽出
      const idParts = interaction.customId.split('_');
      const productId = idParts[2];
      const quantity = parseInt(idParts[3], 10);
      
      if (isNaN(quantity) || quantity <= 0 || !productId) {
        return await interaction.update({
          content: '無効なリクエストです。',
          components: [],
          embeds: [],
          ephemeral: true
        });
      }
      
      // 購入プロセスを完了
      await buyCommand.completePurchase(interaction, productId, quantity);
      
    } catch (error) {
      logger.error(`購入確認ボタンエラー: ${error}`);
      await interaction.update({
        content: `エラーが発生しました: ${error.message}`,
        components: [],
        embeds: [],
        ephemeral: true
      });
    }
  }
}; 