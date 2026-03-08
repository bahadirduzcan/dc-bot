const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath);

  let loadedCount = 0;

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const stat = fs.statSync(categoryPath);
    if (!stat.isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);

      if (!command.data || !command.execute) {
        console.warn(`[UYARI] ${file} dosyasında 'data' veya 'execute' eksik.`);
        continue;
      }

      client.commands.set(command.data.name, command);
      loadedCount++;
    }
  }

  console.log(`[Komutlar] ${loadedCount} komut yüklendi.`);
}

module.exports = { loadCommands };
