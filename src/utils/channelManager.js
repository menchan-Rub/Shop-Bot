const { ChannelType, PermissionFlagsBits } = require('discord.js');
const logger = require('./logger');
const embedManager = require('./embedManager');
const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * カテゴリーに対応するDiscordカテゴリーチャンネルを作成または取得する
 * @param {Object} guild - Discordサーバーオブジェクト
 * @param {Object} category - カテゴリーオブジェクト
 * @param {Array} permissions - 権限の配列（オプション）
 * @returns {Promise<Object>} - 作成または取得したDiscordカテゴリーチャンネル
 */
async function createOrGetCategoryChannel(guild, category, permissions = []) {
  try {
    // 既存のカテゴリーチャンネルIDがあれば取得を試みる
    if (category.channelId) {
      const existingChannel = await guild.channels.fetch(category.channelId).catch(() => null);
      if (existingChannel) {
        logger.info(`カテゴリーチャンネルが既に存在します: ${existingChannel.name} (${existingChannel.id})`);
        return existingChannel;
      }
    }
    
    // カテゴリーチャンネルの作成
    logger.info(`カテゴリーチャンネルを作成します: ${category.getFullName()}`);
    
    // 権限の設定
    const permissionOverwrites = [
      {
        id: guild.id, // @everyone
        deny: [PermissionFlagsBits.SendMessages], // 一般ユーザーのメッセージ送信を禁止
        allow: [PermissionFlagsBits.ViewChannel] // チャンネル表示は許可
      }
    ];
    
    // 追加の権限設定
    if (permissions && permissions.length > 0) {
      permissions.forEach(perm => {
        permissionOverwrites.push({
          id: perm.id,
          allow: perm.allow || [],
          deny: perm.deny || []
        });
      });
    }
    
    // カテゴリー名の設定（絵文字 + 名前）
    const categoryName = category.getFullName();
    
    // カテゴリーチャンネルの作成
    const categoryChannel = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
      permissionOverwrites,
      position: category.displayOrder
    });
    
    // カテゴリーモデルにチャンネルIDを保存
    category.channelId = categoryChannel.id;
    await category.save();
    
    logger.info(`カテゴリーチャンネルを作成しました: ${categoryChannel.name} (${categoryChannel.id})`);
    return categoryChannel;
  } catch (error) {
    logger.error(`カテゴリーチャンネル作成エラー: ${error}`);
    throw error;
  }
}

/**
 * 商品に対応するDiscordテキストチャンネルを作成する
 * @param {Object} guild - Discordサーバーオブジェクト
 * @param {Object} product - 商品オブジェクト
 * @param {Object} categoryChannel - 親カテゴリーチャンネル
 * @returns {Promise<Object>} - 作成したDiscordテキストチャンネル
 */
async function createProductChannel(guild, product, categoryChannel) {
  try {
    // 既存のチャンネルIDがあれば取得を試みる
    if (product.channelId) {
      const existingChannel = await guild.channels.fetch(product.channelId).catch(() => null);
      if (existingChannel) {
        logger.info(`商品チャンネルが既に存在します: ${existingChannel.name} (${existingChannel.id})`);
        return existingChannel;
      }
    }
    
    // チャンネル名の作成（絵文字 + 商品名をDiscord対応の形式に）
    const channelEmoji = product.emoji || '📦';
    const channelName = product.name.toLowerCase()
      .replace(/\s+/g, '-')     // スペースをハイフンに置換
      .replace(/[^\w\-]/g, '')  // 英数字、アンダースコア、ハイフン以外を削除
      .substring(0, 90);        // 長さ制限
    
    // 商品チャンネルの作成
    const productChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryChannel.id,
      topic: `${product.name} - ${product.formattedPrice()} | ${product.description.substring(0, 200)}${product.description.length > 200 ? '...' : ''}`,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.SendMessages], // 一般ユーザーのメッセージ送信を禁止
          allow: [PermissionFlagsBits.ViewChannel]  // チャンネル表示は許可
        }
      ]
    });
    
    // チャンネル名の先頭に絵文字を追加（Discord APIの制限でチャンネル作成時に絵文字を含められないため）
    await productChannel.setName(`${channelEmoji}${channelName}`);
    
    // 商品モデルにチャンネルIDを保存
    product.channelId = productChannel.id;
    await product.save();
    
    logger.info(`商品チャンネルを作成しました: ${productChannel.name} (${productChannel.id})`);
    return productChannel;
  } catch (error) {
    logger.error(`商品チャンネル作成エラー: ${error}`);
    throw error;
  }
}

/**
 * 商品の埋め込みメッセージを作成または更新する
 * @param {Object} channel - Discordチャンネルオブジェクト
 * @param {Object} product - 商品オブジェクト
 * @returns {Promise<Object>} - 作成または更新した埋め込みメッセージ
 */
async function createOrUpdateProductEmbed(channel, product) {
  try {
    // 埋め込みメッセージの生成
    const { embed, row } = embedManager.createProductEmbed(product, { showCartButton: true });
    
    // 既存のメッセージIDがあれば更新を試みる
    if (product.embedMessageId) {
      try {
        const existingMessage = await channel.messages.fetch(product.embedMessageId);
        await existingMessage.edit({ embeds: [embed], components: [row] });
        logger.info(`商品埋め込みメッセージを更新しました: ${product.name} (${product.embedMessageId})`);
        return existingMessage;
      } catch (err) {
        logger.warn(`既存の埋め込みメッセージが見つかりません: ${err}`);
        // 既存メッセージが見つからない場合は新規作成する
      }
    }
    
    // 新しいメッセージの送信
    const message = await channel.send({ embeds: [embed], components: [row] });
    
    // メッセージをピン留めする
    await message.pin().catch(err => logger.warn(`メッセージのピン留め失敗: ${err}`));
    
    // 商品モデルにメッセージIDを保存
    product.embedMessageId = message.id;
    await product.save();
    
    logger.info(`商品埋め込みメッセージを作成しました: ${product.name} (${message.id})`);
    return message;
  } catch (error) {
    logger.error(`商品埋め込みメッセージ作成エラー: ${error}`);
    throw error;
  }
}

/**
 * カテゴリーの埋め込みメッセージを作成または更新する
 * @param {Object} guild - Discordサーバーオブジェクト
 * @param {Object} categoryChannel - Discordカテゴリーチャンネルオブジェクト
 * @param {Object} category - カテゴリーオブジェクト
 * @returns {Promise<void>}
 */
async function setupCategoryOverview(guild, categoryChannel, category) {
  try {
    // カテゴリー概要チャンネルが存在するか確認
    const overviewChannelName = `概要-${category.getChannelName()}`;
    let overviewChannel = guild.channels.cache.find(ch => 
      ch.parentId === categoryChannel.id && 
      ch.name.includes('概要')
    );
    
    // 概要チャンネルがなければ作成
    if (!overviewChannel) {
      overviewChannel = await guild.channels.create({
        name: overviewChannelName,
        type: ChannelType.GuildText,
        parent: categoryChannel.id,
        topic: `${category.name} カテゴリーの商品一覧`,
        permissionOverwrites: [
          {
            id: guild.id, // @everyone
            deny: [PermissionFlagsBits.SendMessages], // メッセージ送信を禁止
            allow: [PermissionFlagsBits.ViewChannel]  // チャンネル表示は許可
          }
        ],
        position: 0 // カテゴリー内の最上部に配置
      });
    }
    
    // カテゴリーに所属する商品を取得
    const products = await Product.find({ category: category._id });
    
    // 埋め込みメッセージの生成
    const embedResult = embedManager.createCategoryEmbed(category, products);
    
    // チャンネル内のメッセージを全て取得
    const messages = await overviewChannel.messages.fetch({ limit: 10 });
    const botMessages = messages.filter(msg => msg.author.bot && msg.embeds.length > 0);
    
    if (botMessages.size > 0) {
      // 最新のbotメッセージを更新
      const latestMessage = botMessages.first();
      if (embedResult.row) {
        await latestMessage.edit({ embeds: [embedResult.embed], components: [embedResult.row] });
      } else {
        await latestMessage.edit({ embeds: [embedResult.embed], components: [] });
      }
    } else {
      // 新規メッセージ送信
      if (embedResult.row) {
        await overviewChannel.send({ embeds: [embedResult.embed], components: [embedResult.row] });
      } else {
        await overviewChannel.send({ embeds: [embedResult.embed] });
      }
    }
    
    logger.info(`カテゴリー概要を更新しました: ${category.name}`);
  } catch (error) {
    logger.error(`カテゴリー概要設定エラー: ${error}`);
    throw error;
  }
}

/**
 * 商品の追加または更新時に関連するDiscordチャンネルと埋め込みメッセージを設定する
 * @param {Object} guild - Discordサーバーオブジェクト
 * @param {Object} product - 商品オブジェクト
 * @returns {Promise<Object>} - 設定結果
 */
async function setupProductChannel(guild, product) {
  try {
    // 商品のカテゴリーを取得
    const category = await Category.findById(product.category);
    if (!category) {
      throw new Error(`カテゴリーが見つかりません: ${product.category}`);
    }
    
    // カテゴリーチャンネルの作成または取得
    const categoryChannel = await createOrGetCategoryChannel(guild, category);
    
    // 商品チャンネルの作成または取得
    const productChannel = await createProductChannel(guild, product, categoryChannel);
    
    // 商品の埋め込みメッセージを作成または更新
    const embedMessage = await createOrUpdateProductEmbed(productChannel, product);
    
    // カテゴリー概要を更新
    await setupCategoryOverview(guild, categoryChannel, category);
    
    return {
      categoryChannel,
      productChannel,
      embedMessage
    };
  } catch (error) {
    logger.error(`商品チャンネル設定エラー: ${error}`);
    throw error;
  }
}

/**
 * 商品の在庫状態に応じてチャンネルの表示を更新する
 * @param {Object} guild - Discordサーバーオブジェクト
 * @param {Object} product - 商品オブジェクト
 * @returns {Promise<void>}
 */
async function updateProductChannelStatus(guild, product) {
  try {
    if (!product.channelId) return;
    
    const channel = await guild.channels.fetch(product.channelId).catch(() => null);
    if (!channel) return;
    
    // 埋め込みメッセージの更新
    if (product.embedMessageId) {
      const message = await channel.messages.fetch(product.embedMessageId).catch(() => null);
      if (message) {
        const { embed, row } = embedManager.createProductEmbed(product, { showCartButton: true });
        await message.edit({ embeds: [embed], components: [row] });
      }
    }
    
    // 在庫状態に応じてチャンネル名を更新
    let prefix = '';
    if (product.status === 'out_of_stock' || (product.status === 'available' && !product.isInStock())) {
      prefix = '❌';
    } else if (product.status === 'pre_order') {
      prefix = '🔜';
    } else if (product.status === 'hidden') {
      prefix = '👁️';
    } else {
      prefix = product.emoji || '📦';
    }
    
    // チャンネル名の形式を保持したまま接頭辞のみ更新
    const currentName = channel.name;
    const nameWithoutEmoji = currentName.replace(/^[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{00A9}\u{00AE}\u{2122}\u{2139}\u{1F201}-\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}-\u{1F251}\u{2196}-\u{2199}\u{2194}-\u{2195}\u{1F197}\u{1F502}\u{1F55A}-\u{1F55B}\u{1F550}-\u{1F559}\u{25AA}-\u{25AB}\u{25FB}-\u{25FE}\u{2573}\u{2665}-\u{2666}\u{2660}-\u{2661}\u{2B55}\u{2705}\u{274C}\u{274E}\u{2795}-\u{2797}\u{27B0}\u{27BF}\u{2753}-\u{2755}\u{2757}\u{3030}\u{1F19A}\u{1F6BB}\u{1F6B9}\u{1F6BA}\u{1F6BC}\u{1F6BB}\u{1F4F5}\u{1F6B7}\u{1F6AF}\u{1F51E}\u{267B}\u{2733}-\u{2734}\u{2747}\u{203C}\u{2049}\u{2028}\u{2029}]+/u, '');
    
    const newName = `${prefix}${nameWithoutEmoji}`;
    if (currentName !== newName) {
      await channel.setName(newName);
    }
    
    // カテゴリー概要の更新
    const categoryChannel = channel.parent;
    if (categoryChannel) {
      const category = await Category.findOne({ channelId: categoryChannel.id });
      if (category) {
        await setupCategoryOverview(guild, categoryChannel, category);
      }
    }
    
    logger.info(`商品チャンネルのステータスを更新しました: ${product.name}`);
  } catch (error) {
    logger.error(`商品チャンネルステータス更新エラー: ${error}`);
    throw error;
  }
}

/**
 * 商品が削除された場合にチャンネルをアーカイブする
 * @param {Object} guild - Discordサーバーオブジェクト
 * @param {Object} product - 商品オブジェクト
 * @param {Boolean} deleteChannel - チャンネルを削除するかアーカイブするか
 * @returns {Promise<void>}
 */
async function archiveProductChannel(guild, product, deleteChannel = false) {
  try {
    if (!product.channelId) return;
    
    const channel = await guild.channels.fetch(product.channelId).catch(() => null);
    if (!channel) return;
    
    if (deleteChannel) {
      // チャンネルを削除
      await channel.delete(`商品が削除されました: ${product.name}`);
      logger.info(`商品チャンネルを削除しました: ${product.name}`);
    } else {
      // チャンネル名の先頭にアーカイブマークを追加
      const newName = `🗃️${channel.name.replace(/^[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{00A9}\u{00AE}\u{2122}\u{2139}\u{1F201}-\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}-\u{1F251}\u{2196}-\u{2199}\u{2194}-\u{2195}\u{1F197}\u{1F502}\u{1F55A}-\u{1F55B}\u{1F550}-\u{1F559}\u{25AA}-\u{25AB}\u{25FB}-\u{25FE}\u{2573}\u{2665}-\u{2666}\u{2660}-\u{2661}\u{2B55}\u{2705}\u{274C}\u{274E}\u{2795}-\u{2797}\u{27B0}\u{27BF}\u{2753}-\u{2755}\u{2757}\u{3030}\u{1F19A}\u{1F6BB}\u{1F6B9}\u{1F6BA}\u{1F6BC}\u{1F6BB}\u{1F4F5}\u{1F6B7}\u{1F6AF}\u{1F51E}\u{267B}\u{2733}-\u{2734}\u{2747}\u{203C}\u{2049}\u{2028}\u{2029}]+/u, '')}`;
      await channel.setName(newName);
      
      // 埋め込みメッセージの更新
      if (product.embedMessageId) {
        try {
          const message = await channel.messages.fetch(product.embedMessageId);
          const embed = new EmbedBuilder()
            .setTitle(`${product.name} [アーカイブ済み]`)
            .setDescription(`この商品は現在販売されていません。\n\n${product.description}`)
            .setColor(0x888888)
            .setTimestamp()
            .setFooter({ text: 'この商品は現在利用できません' });
            
          if (product.images && product.images.length > 0) {
            embed.setImage(product.images[0]);
          }
          
          await message.edit({ embeds: [embed], components: [] });
        } catch (err) {
          logger.warn(`埋め込みメッセージの更新に失敗しました: ${err}`);
        }
      }
      
      logger.info(`商品チャンネルをアーカイブしました: ${product.name}`);
    }
    
    // カテゴリー概要の更新
    const categoryChannel = channel.parent;
    if (categoryChannel) {
      const category = await Category.findOne({ channelId: categoryChannel.id });
      if (category) {
        await setupCategoryOverview(guild, categoryChannel, category);
      }
    }
  } catch (error) {
    logger.error(`商品チャンネルアーカイブエラー: ${error}`);
    throw error;
  }
}

module.exports = {
  createOrGetCategoryChannel,
  createProductChannel,
  createOrUpdateProductEmbed,
  setupCategoryOverview,
  setupProductChannel,
  updateProductChannelStatus,
  archiveProductChannel
}; 