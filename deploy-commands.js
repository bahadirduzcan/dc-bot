require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // Test için (opsiyonel)

if (!token || !clientId) {
  console.error('DISCORD_TOKEN veya CLIENT_ID eksik! .env dosyasını kontrol et.');
  process.exit(1);
}

// Tüm komutları topla
const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const categories = fs.readdirSync(commandsPath);

for (const category of categories) {
  const categoryPath = path.join(commandsPath, category);
  const stat = fs.statSync(categoryPath);
  if (!stat.isDirectory()) continue;

  const commandFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(categoryPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST().setToken(token);

async function deployCommands() {
  console.log(`\n${commands.length} slash komutu kaydediliyor...`);

  try {
    if (guildId) {
      // Test modu: Belirli sunucuya kaydet (anında aktif olur)
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`${commands.length} komut sunucuya kaydedildi! (Guild: ${guildId})`);
      console.log('Sunucu komutları anında aktif olur.');
    } else {
      // Production: Global kayıt (1 saate kadar sürebilir)
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`${commands.length} global komut kaydedildi!`);
      console.log('Global komutların aktif olması 1 saate kadar sürebilir.');
    }

    console.log('\nKayıtlı komutlar:');
    commands.forEach((cmd, i) => {
      console.log(`   ${i + 1}. /${cmd.name} - ${cmd.description}`);
    });
  } catch (error) {
    console.error('Komutlar kaydedilemedi:', error);
    process.exit(1);
  }
}

deployCommands();
