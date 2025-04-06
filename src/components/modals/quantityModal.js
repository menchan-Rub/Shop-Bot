const logger = require('../../utils/logger');
const buyCommand = require('../../commands/buy');
const Product = require('../../models/Product');

module.exports = {
  customId: 'quantity_modal_',
  
  async execute(interaction) {
    try {
      // カスタムIDから商品IDを抽出
      const productId = interaction.customId.split('_')[2];
      
      // 入力された数量を取得
      const quantityInput = interaction.fields.getTextInputValue('quantity_input');
      const quantity = parseInt(quantityInput, 10);
      
      // 数量のバリデーション
      if (isNaN(quantity) || quantity <= 0) {
        return await interaction.reply({
          content: '無効な数量です。正の整数を入力してください。',
          ephemeral: true
        });
      }
      
      // 商品の在庫確認
      const product = await Product.findById(productId);
      if (!product || !product.active) {
        return await interaction.reply({
          content: '商品が見つからないか、現在利用できません。',
          ephemeral: true
        });
      }
      
      if (product.stock < quantity) {
        return await interaction.reply({
          content: `「${product.name}」の在庫が不足しています。在庫: ${product.stock}`,
          ephemeral: true
        });
      }
      
      // 注文プロセスの開始
      await buyCommand.startPurchaseProcess(interaction, productId, quantity);
      
    } catch (error) {
      logger.error(`数量モーダル処理エラー: ${error}`);
      await interaction.reply({
        content: `エラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 