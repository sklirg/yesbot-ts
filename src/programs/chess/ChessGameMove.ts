import { Message, DiscordAPIError, MessageAttachment, DMChannel } from "discord.js"
import { ChessGameRepository, ChessGame } from "../../entities/ChessGame";
import { Chess, ChessInstance } from "chess.js";
import bot from "../..";

export const ChessMove = (message:Message, chessGame:ChessGame) => {

    if(message.content === "!chess quit") {
        forfeitGame(chessGame, message);
        return;
    }

    const chessBoard = new Chess(chessGame.lastBoardLayout)

    const move = chessBoard.move(message.cleanContent, {sloppy:true})
    const currentPlayerId = chessBoard.turn() === "b" ? chessGame.blackPlayer : chessGame.whitePlayer

    if(message.author.id != currentPlayerId) {
        message.reply("It is not your turn!")
        return;
    }
    
    if(!move) message.reply("invalid move")

    else {
        const blackChannel = <DMChannel>bot.channels.cache.find(channel => {
            if(channel.type === "dm") {
                return (channel as DMChannel).recipient.id === chessGame.blackPlayer
            }
        })
        const whiteChannel = <DMChannel>bot.channels.cache.find(channel => {
            if(channel.type === "dm") {
                return (channel as DMChannel).recipient.id === chessGame.whitePlayer
            }
        });
        whiteChannel.send(new MessageAttachment(fenToImage(chessBoard.fen())))
        blackChannel.send(new MessageAttachment(fenToImage(chessBoard.fen())))
        saveGame(chessGame, chessBoard)
    }
    
}

const forfeitGame = async (chessGame: ChessGame, message:Message) => {
    const chessGames = await ChessGameRepository()
    if(chessGame.blackPlayer === message.author.id) {
        const victorMessage = `${message.author.id} has forfeited the game. White is the victor!`;
    }
}

export const fenToImage = (fen:string) => {
    return `http://www.fen-to-image.com/image/${fen}.png`
}

const saveGame = async (chessGame: ChessGame, chessBoard: ChessInstance) => {
    const chessGames = await ChessGameRepository();
    chessGame.lastBoardLayout = chessBoard.fen();
    await chessGames.save(chessGame)
}