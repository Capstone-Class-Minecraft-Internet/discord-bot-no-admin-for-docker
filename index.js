const fs = require('node:fs');
const path = require('node:path');
const request = require('request');
const firebase = require("firebase/app");
const { getDatabase, ref, onValue } = require("firebase/database");
var serviceAccount = require("./mindcraftproject-45d64-firebase-adminsdk-zvqgz-5b8eb881e0.json");

//init firebase app
const firebaseConfig = {
  apiKey: process.argv[7],
  authDomain: process.argv[8],
  databaseURL: process.argv[9],
  projectId: process.argv[10],
  storageBucket: process.argv[11],
  messagingSenderId: process.argv[12],
  appId: process.argv[13]
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = getDatabase(app);

//-------------------- Params
botChannelId = process.argv[2];
botRelayChannelId = process.argv[3];
clientId = process.argv[4];
guildId = process.argv[5];
token = process.argv[6];

//------------------- End of Params


// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection, Intents } = require('discord.js');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages , GatewayIntentBits.MessageContent] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}
// Loading command files 

client.on(Events.InteractionCreate, interaction => {
	console.log(interaction);
});
//every slash command is an interaction


client.on(Events.InteractionCreate, interaction => {
	if (!interaction.isChatInputCommand()) return;
	console.log(interaction);
});
//Not every interaction is a slash command (e.g. MessageComponent interactions)
// Receiving command interactions

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});
// Executing commands


/*
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'beep') {
		await interaction.reply('Boop!');
	}
});
*/

function requestData(link,uName){
	
	commandsToRun = '';
	structureLen = 85 + 40;
	promiseArr = [];

	try{
	//https://mindcraftproject-45d64-default-rtdb.firebaseio.com/.json
		console.log("***Reqeusting data from link: " + link);
		request(link, (err,res,body) => {
		if (err) {return console.log(err)};
		//console.log(body);
		commandsToRun = JSON.parse(body);
		//console.log("***Printing commands to run: "+ commandsToRun);

		console.log("***Building command Books");
		/*
		Defines the maximum size of the command to be sent through discord.
		Discord only has a 2000 character limit for messages without discord nitro. 
		structureLen is subtracted from this maximum character number to find the amount of space that is left for MC commands.
		*/

		allowedCommandCharacters = 2000 - structureLen;
		let botCh = client.channels.cache.get(botRelayChannelId);
		
		commandsToRun = commandsToRun.reverse(); // make the following loop faster, since we can use pop (O(1)) instead of shift(O(n))
		console.log("reversed")
		while(commandsToRun.length > 0){
			remainingChars = allowedCommandCharacters;
			bookCommands = [];

			while(remainingChars > 0 && commandsToRun.length != 0){
				commandLen = commandsToRun[commandsToRun.length-1].length;
				remainingChars = remainingChars - (3+commandLen) //Three characters are added to the commandLen to account for the extra space the quotation marks and commas take up for each element in json.
				if(remainingChars >= 0){
					bookCommands.push(commandsToRun.pop()); //Pop the first element of commandsToRun, and append it to bookCommands

				}
			}
			bookCommandsString = JSON.stringify(bookCommands);
			builtBookMCCommand = 'data modify storage minecraft:ram cmds append value ' + bookCommandsString;
			//Execute MC Book Command
			promiseArr.push(botCh.send(builtBookMCCommand));
			
		}
		botCh.send(`tell * The build has finished loading. You can create your build by running the computer from !get_computer.`);
		



		
		/*
		commandStructure = 
		commandPreStructure = "Minecraft:give name minecraft:writable_book{pages:"
		
		commandsString = JSON.stringify(commandsToRun);
		*/

		/*
		for(let commandNum = 0; commandNum < commandsToRun.length; commandNum++){
			command = commandsToRun[commandNum];
			console.log(command);
			if(command != 'x'){
				client.channels.cache.get(botRelayChannelId).send(commandsToRun[commandNum]);
			}
		}
		*/

	});
	console.log("***Commands run sucessfully");
	return true;
	}
	catch (e){
		console.log(e);
		return false;
	}

}

/*Verifies function parameters, and calls functions accordingly.
 * If a function runs correctly, return True. Otherwise, return false
 */

function commandTokenizer(inputCommand, username){ 	
	if(inputCommand.charAt(0) == '!'){//Verifies that the first character is an explination point
	
		//Tokenize command
		command = inputCommand.slice(1);
		tokenArr = command.split(" ");

		switch(tokenArr[0]){//Read and run tokenized Commands
			case "ping":
				console.log("Running ping command.");
				client.channels.cache.get(botRelayChannelId).send(`tell ${username} Pong!`);
				break;

			case "get_build":
				console.log("Running get_build command.");
				// client.channels.cache.get(botRelayChannelId).send(`tell ${username} This command is currently under construction.`);
				//jiandong/chicken_farm
				var p = tokenArr[1];
				var given_path = p.split("/");
				let user_name = given_path[0];
				let build_id = given_path[1];
				console.log("User name: " + user_name + " Build ID: " + build_id);
				var uid;
				var full_path;
				onValue(ref(db, 'username/' + user_name), (snapshot) => {
					uid = snapshot.val();
					full_path = "https://mindcraftproject-45d64-default-rtdb.firebaseio.com/user/" + uid + "/" + build_id + ".json";
					requestData(full_path,username);
				  }, {
					onlyOnce: true
				  });
				//Tell the user the commands are done loading.
				break;
			case "get_computer":
				console.log("Running get_computer command.");
				//This is messy, but should be good for a temporary example.

				fs.readFile('./build_computer_command','utf8',(err,data) => {
					if(err){
						console.log("Error reading get_computer_command file.");

				}
					//Send command from file to user.
					client.channels.cache.get(botRelayChannelId).send('minecraft:give ' + username + ' ' + data);
				})
				break;

			default:
				console.log("Command not recognized: " + tokenArr[0]);
		}


	}
	else{// The first character is not an explination point. Something weird happened. 
		console.log("Invalid command initializer");
		return false;
	}
}

client.on("messageCreate", async (message) =>{//This command runs every time a message in the discord server is sent.
	try{
	if(message.author.username == '_testbot'){// If a message is from the bot itself, return
		return false;
	}

	if(message.content == 'Unknown command. Type "/help" for help.'){
		return false;

	}

	if(message.channel == botChannelId){//If message is in non-relay bot channel
		await message.channel.send("Received a message: " + message.content);
		
		messageArr = message.content.split(": ",2); //Splits name and message
		console.log(messageArr);
		username = messageArr[0]
		messageContent = messageArr[1]

		commandTokenizer(messageContent,username);
		//await client.channels.cache.get(botRelayChannelId).send("say hi");
	}
	}
	catch (e){
		console.log("Logging error in messageCreate: ");
		console.log(e);
	}
});


client.on("error", console.log);
client.on("warn", console.log);
client.on("debug", console.log);

// Log in to Discord with your client's token
client.login(token);

//commandTokenizer("!get_build jw/0", "o0o0o0oJDo0o0o0o")
