const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('echos!')
		.addStringOption(option =>
			option.setName('input').setDescription('echo')),
	async execute(interaction) {
		await interaction.reply(interaction.options.getString('input'));
	},
};
