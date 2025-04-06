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

module.exports = {
  customId: /^buy_(.+)$/,
  
  async execute(interaction, client) {
    try {
      // 商品IDを取得
      const productId = interaction.customId.split('_')[1];
      
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
          content: `申し訳ありませんが、「${product.name}」は現在在庫切れです。入荷通知を受け取るには「入荷通知」ボタンをクリックしてください。`,
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
      
      // 購入確認メッセージの作成
      const embed = new EmbedBuilder()
        .setTitle(`${product.name} の購入確認`)
        .setDescription(`以下の商品を購入しますか？`)
        .addFields(
          { name: '商品名', value: product.name, inline: true },
          { name: '価格', value: product.formattedPrice(), inline: true },
          { name: '在庫数', value: `${product.stock} 個`, inline: true }
        )
        .setColor('#0099ff')
        .setTimestamp();
        
      if (product.images && product.images.length > 0) {
        embed.setImage(product.images[0]);
      }
      
      // 購入数量選択UI
      const quantityRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`buy_quantity_${productId}_1`)
            .setLabel('1個')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`buy_quantity_${productId}_2`)
            .setLabel('2個')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`buy_quantity_${productId}_5`)
            .setLabel('5個')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`buy_quantity_${productId}_10`)
            .setLabel('10個')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`buy_quantity_custom_${productId}`)
            .setLabel('カスタム数量')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // 購入・キャンセルボタン  
      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`cart_add_${productId}`)
            .setLabel('カートに追加')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🛒'),
          new ButtonBuilder()
            .setCustomId(`cancel_purchase`)
            .setLabel('キャンセル')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );
      
      // DMで購入確認メッセージを送信
      try {
        await interaction.user.send({
          embeds: [embed],
          components: [quantityRow, actionRow]
        });
        
        // 元のメッセージに対して応答
        await interaction.reply({
          content: 'DMで購入手続きを開始しました。DMをご確認ください。',
          ephemeral: true
        });
      } catch (error) {
        // DMが送信できない場合
        logger.error(`DMの送信に失敗しました: ${error}`);
        await interaction.reply({
          content: 'DMを送信できませんでした。プライバシー設定でDMを許可してください。',
          ephemeral: true
        });
      }
    } catch (error) {
      logger.error(`商品購入エラー: ${error}`);
      await interaction.reply({
        content: `購入処理中にエラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 