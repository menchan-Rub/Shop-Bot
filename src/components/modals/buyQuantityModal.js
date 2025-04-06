const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle
} = require('discord.js');
const logger = require('../../utils/logger');
const Product = require('../../models/Product');
const User = require('../../models/User');

module.exports = {
  customId: /^buy_quantity_modal_(.+)$/,
  
  async execute(interaction, client) {
    try {
      // 商品IDを取得
      const productId = interaction.customId.split('_').pop();
      
      // 入力値を取得
      const quantityInput = interaction.fields.getTextInputValue('quantity');
      const quantityNum = parseInt(quantityInput);
      
      // 入力値のバリデーション
      if (isNaN(quantityNum) || quantityNum <= 0) {
        return await interaction.reply({
          content: '有効な数値を入力してください。',
          ephemeral: true
        });
      }
      
      // 商品データを取得
      const product = await Product.findById(productId);
      if (!product) {
        return await interaction.reply({
          content: '商品が見つかりません。削除された可能性があります。',
          ephemeral: true
        });
      }
      
      // 在庫確認
      if (!product.isInStock() || product.stock < quantityNum) {
        return await interaction.reply({
          content: `申し訳ありませんが、「${product.name}」の在庫が不足しています。現在の在庫: ${product.stock}個`,
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
      
      // 注文確認のメッセージを作成
      const totalPrice = product.price * quantityNum;
      
      const embed = new EmbedBuilder()
        .setTitle('注文内容の確認')
        .setDescription(`以下の内容で注文を確定しますか？`)
        .addFields(
          { name: '商品名', value: product.name, inline: true },
          { name: '単価', value: product.formattedPrice(), inline: true },
          { name: '数量', value: `${quantityNum}個`, inline: true },
          { name: '合計金額', value: `¥${totalPrice.toLocaleString()}`, inline: false },
          { name: '保有ポイント', value: `${user.points}ポイント`, inline: true }
        )
        .setColor('#00cc99')
        .setTimestamp();
        
      if (product.images && product.images.length > 0) {
        embed.setImage(product.images[0]);
      }
      
      // 支払い方法の選択ボタン
      const paymentRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`payment_bank_${productId}_${quantityNum}`)
            .setLabel('銀行振込')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏦'),
          new ButtonBuilder()
            .setCustomId(`payment_stripe_${productId}_${quantityNum}`)
            .setLabel('クレジットカード')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💳')
        );
      
      // ポイント支払いボタン（ポイントが十分ある場合のみ）
      if (user.points >= totalPrice) {
        paymentRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`payment_points_${productId}_${quantityNum}`)
            .setLabel('ポイント支払い')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🪙')
        );
      }
      
      // キャンセルボタン
      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`cart_add_with_quantity_${productId}_${quantityNum}`)
            .setLabel('カートに追加する')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛒'),
          new ButtonBuilder()
            .setCustomId(`cancel_purchase`)
            .setLabel('キャンセル')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );
      
      // モーダルの応答
      await interaction.reply({
        embeds: [embed],
        components: [paymentRow, actionRow],
        ephemeral: true
      });
    } catch (error) {
      logger.error(`購入数量モーダル処理エラー: ${error}`);
      await interaction.reply({
        content: `エラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 