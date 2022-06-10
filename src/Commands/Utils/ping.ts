import type { Command } from "../../Interfaces";
import { MessageEmbed } from "discord.js";

export const command: Command = {
  name: "ping",
  aliases: ["p", "latency"],
  run: async (client, message) => {
    const embed = new MessageEmbed()
      .setColor("#0099ff")
      .setDescription(`Pong! \`${client.ws.ping.toString()}ms\``);
    message.channel.send({ embeds: [embed] });
  },
};
