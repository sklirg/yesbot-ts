import Discord, { TextChannel, DMChannel } from 'discord.js';
import Tools from '../../common/tools';
import { promises } from 'dns';
import { ChessGameRepository } from '../../entities/ChessGame';


export default async function ChessGameStart(message: Discord.Message) {

    const chessGames = await ChessGameRepository();

    const authorGame = await chessGames.findOne({
        where: [
            {whitePlayer: message.author.id},
            {blackPlayer: message.author.id}
        ]
    });

    if(authorGame) {
        const currentOp = message.author.id === authorGame.blackPlayer ? authorGame.whitePlayer : authorGame.blackPlayer;
        message.reply(`you cannot start a new game, you are still in game with <@${currentOp}>!`);
        return;
    }

    const challengeMeMessage = await message.channel.send(`${message.member.toString()} wants to play chess? Who's up for the challenge? This challenge will expire after 30 seconds.`)
    
    const filter:Discord.CollectorFilter = (reaction: any, user: Discord.User) => {
        return !user.bot && !(user === message.author)
    }

    const options:Discord.AwaitReactionsOptions ={
        max:1,
        time: 30000
    }

    challengeMeMessage.react("💪");
    const collected = await challengeMeMessage.awaitReactions(filter, options)
    const reaction = collected.first();
    const lastUser = (await reaction.users.fetch({limit:1})).last();
    challengeMeMessage.edit(`${message.member.toString()} VS. ${lastUser.toString()} in a game of chess, starting now!`);

    if(lastUser) {
        const challengerGame = await findGameByUser(lastUser.id)
        if(challengerGame) {
            const currentOp = lastUser.id === challengerGame.blackPlayer ? challengerGame.whitePlayer : challengerGame.blackPlayer;
            message.channel.send(`${lastUser.toString()}, you cannot accept this challenge, you are still in game with <@${currentOp}>!`);
            return;
        }
        const dmChannels = await Promise.all([lastUser.createDM(), message.author.createDM()])
        dmChannels.forEach((channel:DMChannel) => {
            const oponent = channel.recipient === message.author ? channel.recipient : message.author
            const pieceSelection = channel.recipient === message.author ? "You are the challenger, which means your pieces are white. It is your turn. Please enter a valid AN move. (https://blog.chesshouse.com/how-to-read-and-write-algebraic-chess-notation/)" : "You are the challengee, which means your pieces are black. You must wait for your opponent to move."
            channel.send(`You have begun a chess match with ${oponent.toString()}. This DM channel is now entering chess mode. **To exit chess mode, you must type !chess quit. This will forfeit the current game immediately.**\n\n${pieceSelection}`)
        })
        
    }




    try {
        console.info("ChessGame: Creating database record")
        chessGames.save({
            whitePlayer: lastUser.id,
            blackPlayer: message.author.id
        });
        console.log("Chess game successfully started.")
    } catch (e) {
        console.error(`Failed to create new ChessGame record.'`);
        return false;
    }

    return true;
}

export const findGameByUser = async (userId:string) => {
    return (await ChessGameRepository()).findOne({
        where: [
            {whitePlayer: userId},
            {blackPlayer: userId}
        ]
    });
}