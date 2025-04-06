require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('./utils/logger');

// Botクライアントの初期化
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ]
});

// コマンドとイベントコレクションの初期化
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

// データベース接続
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected successfully'))
  .catch(err => logger.error(`MongoDB connection error: ${err}`));

// コマンドハンドラー
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// イベントハンドラー
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// ボタンハンドラー
const buttonsPath = path.join(__dirname, 'components', 'buttons');
if (fs.existsSync(buttonsPath)) {
  const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
  for (const file of buttonFiles) {
    const filePath = path.join(buttonsPath, file);
    const button = require(filePath);
    client.buttons.set(button.customId, button);
  }
}

// セレクトメニューハンドラー
const selectMenusPath = path.join(__dirname, 'components', 'selectMenus');
if (fs.existsSync(selectMenusPath)) {
  const selectMenuFiles = fs.readdirSync(selectMenusPath).filter(file => file.endsWith('.js'));
  for (const file of selectMenuFiles) {
    const filePath = path.join(selectMenusPath, file);
    const selectMenu = require(filePath);
    client.selectMenus.set(selectMenu.customId, selectMenu);
  }
}

// モーダルハンドラー
const modalsPath = path.join(__dirname, 'components', 'modals');
if (fs.existsSync(modalsPath)) {
  const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));
  for (const file of modalFiles) {
    const filePath = path.join(modalsPath, file);
    const modal = require(filePath);
    client.modals.set(modal.customId, modal);
  }
}

// インタラクションハンドラー
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction, client);
    } else if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);
      if (!button) return;

      await button.execute(interaction, client);
    } else if (interaction.isSelectMenu()) {
      const selectMenu = client.selectMenus.get(interaction.customId);
      if (!selectMenu) return;

      await selectMenu.execute(interaction, client);
    } else if (interaction.isModalSubmit()) {
      const modal = client.modals.get(interaction.customId);
      if (!modal) return;

      await modal.execute(interaction, client);
    }
  } catch (error) {
    logger.error(`Error handling interaction: ${error}`);
    const errorMessage = { content: '申し訳ありませんが、コマンドの実行中にエラーが発生しました。', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// ボットの起動
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger.info(`Logged in as ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: 'ショップを管理中', type: ActivityType.Playing }],
      status: 'online',
    });
  })
  .catch(error => {
    logger.error(`Login error: ${error}`);
    process.exit(1);
  }); 