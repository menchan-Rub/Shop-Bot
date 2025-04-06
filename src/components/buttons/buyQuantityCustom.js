const { 
  ActionRowBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} = require('discord.js');
const logger = require('../../utils/logger');
const Product = require('../../models/Product');

module.exports = {
  customId: 'buy_quantity_custom_',
  
  async execute(interaction) {
    try {
      // カスタムIDから商品IDを抽出
      const idParts = interaction.customId.split('_');
      const productId = idParts[3];
      
      if (!productId) {
        return await interaction.reply({
          content: '無効なリクエストです。',
          ephemeral: true
        });
      }
      
      // 商品情報を取得（在庫確認のため）
      const product = await Product.findById(productId);
      if (!product || !product.active) {
        return await interaction.reply({
          content: '商品が見つからないか、現在利用できません。',
          ephemeral: true
        });
      }
      
      if (product.stock <= 0) {
        return await interaction.reply({
          content: `「${product.name}」は現在在庫切れです。`,
          ephemeral: true
        });
      }
      
      // 数量入力用のモーダルを作成
      const modal = new ModalBuilder()
        .setCustomId(`quantity_modal_${productId}`)
        .setTitle('購入数量を入力');
      
      // 数量入力フィールド
      const quantityInput = new TextInputBuilder()
        .setCustomId('quantity_input')
        .setLabel(`${product.name}の購入数量`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('1〜' + Math.min(10, product.stock))
        .setMinLength(1)
        .setMaxLength(2)
        .setRequired(true);
      
      // 行にコンポーネントを追加
      const firstActionRow = new ActionRowBuilder().addComponents(quantityInput);
      
      // モーダルに行を追加
      modal.addComponents(firstActionRow);
      
      // モーダルを表示
      await interaction.showModal(modal);
      
    } catch (error) {
      logger.error(`カスタム数量指定ボタンエラー: ${error}`);
      await interaction.reply({
        content: `エラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 