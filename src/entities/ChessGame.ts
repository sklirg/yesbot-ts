import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, getConnection, ManyToMany, JoinTable } from "typeorm";


@Entity()
export class ChessGame {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    whitePlayer: string;

    @Column("text")
    blackPlayer: string;

    @Column("text", {nullable: true})
    winningColor: "black" | "white" | null;

}

export const ChessGameRepository = async () => {
    return getConnection().getRepository(ChessGame);
};

