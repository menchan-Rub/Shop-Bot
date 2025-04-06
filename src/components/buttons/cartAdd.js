const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle
} = require('discord.js');
const logger = require('../../utils/logger');
const Product = require('../../models/Product');
const User = require('../../models/User');
const embedManager = require('../../utils/embedManager');

module.exports = {
  customId: /^cart_add_(.+)$/,
  
  async execute(interaction, client) {
    try {
      // 商品IDを取得
      const productId = interaction.customId.split('_')[2];
      
      // 商品データを取得
      const product = await Product.findById(productId);
      if (!product) {
        return await interaction.reply({
          content: '商品が見つかりません。削除された可能性があります。',
          ephemeral: true
        });
      }
      
      // 在庫確認
      if (!product.isInStock()) {
        return await interaction.reply({
          content: `申し訳ありませんが、「${product.name}」は現在在庫切れです。`,
          ephemeral: true
        });
      }
      
      // 商品のステータス確認
      if (product.status !== 'available') {
        return await interaction.reply({
          content: `この商品は現在購入できません。ステータス: ${product.getStatusText()}`,
          ephemeral: true
        });
      }
      
      // ユーザーを取得または作成
      let user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        user = new User({
          discordId: interaction.user.id,
          username: interaction.user.username,
          discriminator: interaction.user.discriminator,
          avatar: interaction.user.avatar
        });
        await user.save();
      }
      
      // カートに商品を追加（デフォルトは1個）
      await user.addToCart(productId);
      
      // カート内の商品情報を取得
      await user.populate({
        path: 'cart.product',
        model: 'Product'
      });
      
      // カートの埋め込みメッセージを作成
      const { embed, components } = embedManager.createCartEmbed(user, user.cart);
      
      // カート追加完了メッセージ
      await interaction.reply({
        content: `「${product.name}」をカートに追加しました！`,
        embeds: [embed],
        components: components,
        ephemeral: true
      });
    } catch (error) {
      logger.error(`カート追加エラー: ${error}`);
      await interaction.reply({
        content: `カートへの追加中にエラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 