var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });

bot.beginDialogAction('help', '/help', { matches: /^help/i });
bot.beginDialogAction('reset', '/reset', { matches: /^reset/i });

//=========================================================
// Bots Dialogs
//=========================================================

var model = process.env.model || 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/0355ead1-2d08-4955-ab95-e263766e8392?subscription-key=YOURSUBSCRIPTIONKEY';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

intents.matches('builtin.intent.places.find_place', [
    function (session, args, next) {
        var place = builder.EntityRecognizer.findEntity(args.entities, 'builtin.places.place_type');
				var cuisine = builder.EntityRecognizer.findEntity(args.entities, 'builtin.places.cuisine');
				var time = builder.EntityRecognizer.resolveTime(args.entities);

				if (place.resolution.value == "restaurants")
				{
					if(!cuisine)
					{
						session.send("OK. Tu souhaites un restaurant. Une préférence ?");
					}
					else
					{
						session.send("OK. Tu souhaites un restaurant %s. Je gère !", cuisine.entity);
						if (time)
						{
								session.send('Réservation pour le %d/%d/%d', time.getMonth() + 1, time.getDate(), time.getFullYear());
						}
					}	
				}
				else
				{
					  session.send("Désolé. Je ne réserve que les restaurants moi !");
				}
				
				session.endDialog();
    }
]);

intents.onDefault(builder.DialogAction.send("Je ne comprends pas !"));

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results, next) {
        session.send('Hello %s!', session.userData.name);
				session.send('Comment puis-je vous aider?');
				session.beginDialog('/cortana');
    }
]);

bot.dialog('/profile', [
		function (session) {
        session.beginDialog('/picture');
    },
    function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?");
    },
    function (session, results) {
        session.userData.coding = results.response;
        builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);
    },
    function (session, results) {
        session.userData.language = results.response.entity;
        session.send("Got it... " + session.userData.name +
            " you've been programming for " + session.userData.coding +
            " years and use " + session.userData.language + ".");
        session.endDialog();
    }
]);

bot.dialog('/picture', [
    function (session) {
        var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: "http://www.theoldrobots.com/images62/Bender-18.JPG"
            }]);
        session.endDialog(msg);
    }
]);

bot.dialog('/cortana', intents);

bot.dialog('/help', [
    function (session) {
        session.endDialog("Global commands that are available anytime:\n\n* goodbye - End this conversation.\n* help - Displays these commands.");
    }
]);

bot.dialog('/reset', [
    function (session) {
        session.userData.name = null;
        session.send('I have reset the profile.');
        session.endDialog();
    }
]);
