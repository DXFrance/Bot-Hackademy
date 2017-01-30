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

bot.dialog('/', [
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session) {
        session.send('Hello %s!', session.userData.name);
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
