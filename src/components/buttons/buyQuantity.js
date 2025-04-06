const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const logger = require('../../utils/logger');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Order = require('../../models/Order');
const embedManager = require('../../utils/embedManager');
const buyCommand = require('../../commands/buy');

module.exports = {
  // buy_quantity_1_productId, buy_quantity_2_productId, buy_quantity_3_productId の形式
  customId: 'buy_quantity_',
  
  async execute(interaction) {
    try {
      // カスタムIDから数量と商品IDを抽出
      const idParts = interaction.customId.split('_');
      const quantity = parseInt(idParts[2], 10);
      const productId = idParts[3];
      
      if (isNaN(quantity) || quantity <= 0 || !productId) {
        return await interaction.reply({
          content: '無効なリクエストです。',
          ephemeral: true
        });
      }
      
      // 購入プロセスを開始
      await buyCommand.startPurchaseProcess(interaction, productId, quantity);
      
    } catch (error) {
      logger.error(`数量指定購入ボタンエラー: ${error}`);
      await interaction.reply({
        content: `エラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 