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
const channelManager = require('../../utils/channelManager');

module.exports = {
  customId: /^payment_(\w+)_(.+)_(\d+)$/,
  
  async execute(interaction, client) {
    try {
      // 支払い方法、商品ID、数量を取得
      const [paymentMethod, productId, quantity] = interaction.customId.split('_').slice(1);
      const quantityNum = parseInt(quantity);
      
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
      
      // ユーザーを取得
      const user = await User.findOne({ discordId: interaction.user.id });
      if (!user) {
        return await interaction.reply({
          content: 'ユーザーデータが見つかりません。',
          ephemeral: true
        });
      }
      
      // 合計金額の計算
      const totalAmount = product.price * quantityNum;
      
      // ポイント支払いの場合、ポイントが十分あるか確認
      if (paymentMethod === 'points' && user.points < totalAmount) {
        return await interaction.reply({
          content: `ポイントが不足しています。必要ポイント: ${totalAmount}、保有ポイント: ${user.points}`,
          ephemeral: true
        });
      }
      
      // 注文オブジェクトの作成
      const order = new Order({
        user: user._id,
        discordId: user.discordId,
        username: user.username,
        items: [{
          product: product._id,
          quantity: quantityNum,
          price: product.price,
          name: product.name
        }],
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'points' ? 'paid' : 'pending'
      });
      
      // 注文の保存
      await order.save();
      logger.info(`新規注文を作成しました: ${order._id} (ユーザー: ${user.username})`);
      
      // ポイント支払いの場合、ポイントを使用
      if (paymentMethod === 'points') {
        await user.usePoints(totalAmount);
        logger.info(`ポイント支払い: ${user.username} が ${totalAmount} ポイントを使用`);
      }
      
      // 在庫の更新
      product.stock -= quantityNum;
      if (product.stock <= 0) {
        product.status = 'out_of_stock';
      }
      await product.save();
      
      // 商品チャンネルのステータス更新
      client.guilds.fetch(process.env.GUILD_ID).then(guild => {
        channelManager.updateProductChannelStatus(guild, product)
          .catch(err => logger.error(`チャンネルステータス更新エラー: ${err}`));
      });
      
      // 支払い方法に応じたメッセージ
      let paymentInstructions = '';
      let paymentStatusText = '';
      
      switch (paymentMethod) {
        case 'bank':
          paymentInstructions = `
          **銀行振込手順:**
          1. 以下の口座に合計金額をお振込みください。
             銀行名: ○○銀行
             支店名: ×××支店
             口座種別: 普通
             口座番号: 1234567
             口座名義: XXXX XXXX
          2. 振込完了後、注文IDを振込名義の後に記載してください。
             例: ヤマダタロウ ${order._id.toString().substring(0, 8)}
          3. 振込が確認され次第、商品を発送いたします。
          `;
          paymentStatusText = '銀行振込（支払い待ち）';
          break;
          
        case 'stripe':
          paymentInstructions = `
          **クレジットカード決済手順:**
          1. 以下のリンクから決済ページにアクセスしてください。
             ${process.env.DASHBOARD_URL}/payment/${order._id}
          2. クレジットカード情報を入力して決済を完了してください。
          3. 決済完了後、商品を発送いたします。
          `;
          paymentStatusText = 'クレジットカード（支払い待ち）';
          break;
          
        case 'points':
          paymentInstructions = `
          **ポイント支払い:**
          ✅ ${totalAmount}ポイントを使用して支払いが完了しました。
          商品の準備が整い次第、発送いたします。
          `;
          paymentStatusText = 'ポイント支払い（支払い済み）';
          break;
      }
      
      // 注文確認メッセージの作成
      const embed = new EmbedBuilder()
        .setTitle('注文が確定しました')
        .setDescription(`ご注文ありがとうございます！以下の内容で注文を受け付けました。`)
        .addFields(
          { name: '注文ID', value: order._id.toString(), inline: false },
          { name: '商品名', value: product.name, inline: true },
          { name: '数量', value: `${quantityNum}個`, inline: true },
          { name: '合計金額', value: `¥${totalAmount.toLocaleString()}`, inline: true },
          { name: '支払い方法', value: paymentStatusText, inline: false },
          { name: '支払い手順', value: paymentInstructions, inline: false }
        )
        .setColor('#00FF00')
        .setTimestamp()
        .setFooter({ text: '注文に関するお問い合わせは管理者までご連絡ください。' });
      
      // ボタン
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`order_details_${order._id}`)
            .setLabel('注文詳細')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋'),
          new ButtonBuilder()
            .setCustomId(`order_contact_${order._id}`)
            .setLabel('サポートに問い合わせ')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('💬')
        );
        
      // Stripe決済の場合は決済ページへのリンクを追加
      if (paymentMethod === 'stripe') {
        row.addComponents(
          new ButtonBuilder()
            .setLabel('決済ページへ進む')
            .setURL(`${process.env.DASHBOARD_URL}/payment/${order._id}`)
            .setStyle(ButtonStyle.Link)
            .setEmoji('💳')
        );
      }
      
      // 元のメッセージを更新
      await interaction.update({
        embeds: [embed],
        components: [row]
      });
      
      // 管理者への通知
      try {
        const adminChannel = await client.channels.fetch(process.env.ADMIN_CHANNEL_ID);
        if (adminChannel) {
          const adminEmbed = new EmbedBuilder()
            .setTitle('新規注文があります')
            .setDescription(`注文ID: ${order._id}`)
            .addFields(
              { name: 'ユーザー', value: user.username, inline: true },
              { name: '商品', value: product.name, inline: true },
              { name: '数量', value: `${quantityNum}個`, inline: true },
              { name: '合計金額', value: `¥${totalAmount.toLocaleString()}`, inline: true },
              { name: '支払い方法', value: paymentStatusText, inline: true },
              { name: '注文日時', value: new Date().toLocaleString('ja-JP'), inline: true }
            )
            .setColor('#FF9900')
            .setTimestamp();
          
          await adminChannel.send({ embeds: [adminEmbed] });
        }
      } catch (error) {
        logger.error(`管理者通知エラー: ${error}`);
      }
    } catch (error) {
      logger.error(`支払い処理エラー: ${error}`);
      await interaction.reply({
        content: `支払い処理中にエラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 