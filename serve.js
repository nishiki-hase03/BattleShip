'use strict';

// モジュール
const express = require( 'express' );
const http = require( 'http' );
const socketIO = require( 'socket.io' );

//DB
const sqlite3 = require( 'sqlite3' );
var db = new sqlite3.Database('mydb.sqlite');

// オブジェクト
const app = express();
const server = http.Server( app );
const io = socketIO( server );

// 定数
const PORT = process.env.PORT || 1337;
const SYSTEMNICKNAME = '**system**'

// 関数
// 数字を２桁の文字列に変換
const toDoubleDigitString =
    ( num ) =>
    {
        return ( "0" + num ).slice( -2 );   // slice( -2 )で後ろから２文字取り出す。
    };

// 時刻文字列の作成（書式は「YY/DD/MM hh:mm ss」）
const makeTimeString =
    ( time ) =>
    {
        return toDoubleDigitString( time.getFullYear() ) + '/' + toDoubleDigitString( time.getMonth() + 1 ) + '/' + toDoubleDigitString( time.getDate() )
            + ' ' + toDoubleDigitString( time.getHours() ) + ':' + toDoubleDigitString( time.getMinutes() ) + ' ' + toDoubleDigitString( time.getSeconds() );
    }

// グローバル変数
let iCountUser = 0; // ユーザー数

// 接続時の処理
// ・サーバーとクライアントの接続が確立すると、
// 　サーバー側で、'connection'イベント
// 　クライアント側で、'connect'イベントが発生する
io.on(
    'connection',
    ( socket ) =>
    {
        //RoomIDを乱数で生成
        var roomID = Math.random().toString(32).substring(2);
        console.log( 'connection' );

        let strNickname = '';	// コネクションごとで固有のニックネーム。イベントをまたいで使用される。

        // 切断時の処理
        // ・クライアントが切断したら、サーバー側では'disconnect'イベントが発生する
        socket.on(
            'disconnect',
            () =>
            {
                console.log( 'disconnect' );

                // ルームからの退室処理
                db.all("select * from room where id= ?", roomID, (err, rows) => {
                    if ( !err ) {
                        //存在するroomIDか
                        if ( rows.length > 0 ) {
                            var unum = rows[0].user_num - 1;
                            //退室後のroom人数が0の場合、roomを削除
                            if (unum == 0) {
                                db.run("delete from room where id= ?", roomID);
                            //退室後のroom人数が1の場合、人数を1に
                            } else if (unum == 1) {
                                db.run("update room set user_num = ? where id= ?", unum, roomID);
                            }
                            console.log("room:" + roomID + " logout");
                        }
                    }
                });
            } );

        // 入室時の処理
        // ・クライアント側のメッセージ送信時の「socket.emit( 'join', strNickname );」に対する処理
        socket.on(
            'join',
            ( strNickname_, inputRoomID_ ) =>
            {

                //roomIDが入力されていなかった場合
                if (inputRoomID_ == '') {
                    //参加人数１のroomを検索
                    db.all("select * from room where user_num = 1" , (err, rows) => {
                        //参加人数1のroomがあった場合
                        if (rows.length > 0) {
                            //一番古いroomの人数を2にして、RoomIDを取得してセットしなおす
                            db.run("update room set user_num = ? where id= ?", 2, rows[0].id);
                            console.log("into room " + roomID);
                            roomID = rows[0].id;
                            io.to(roomID).emit( 'match', socket.id );
                        //参加人数1のroomがなかった場合
                        } else {
                            //新しいroomを生成し、参加人数を1にする
                            db.run("insert into room (id, user_num) values (?, ?)", roomID, 1);
                            console.log("new room:" + roomID + " create");
                        }
                        //参加するroomにsocketを接続する。
                        socket.join(roomID);
                        io.to(roomID).emit( 'into room', roomID );
                    });
                    

                //roomIDが入力されていた場合
                } else {
                    db.all("select * from room where id = ?", inputRoomID_, (err, rows) => {
                        //入力されたroomIDが存在する場合
                        if (rows.length > 0) {
                            //roomの人数を2にして、RoomIDを取得してセットしなおす
                            db.run("update room set user_num = ? where id= ?", 2, inputRoomID_);
                            console.log("into room " + inputRoomID_);
                            io.to(roomID).emit( 'match', socket.id );
                        //入力されたroomIDが存在しない場合
                        } else {
                            //新しいroomを生成し、参加人数を1にする
                            db.run("insert into room (id, user_num) values (?, ?)", inputRoomID_, 1);
                            //参加するroomにsocketを接続する。
                            console.log(inputRoomID_ + " is not exist");
                            console.log("new room:" + inputRoomID_ + " create");
                        }
                    });
                    roomID = inputRoomID_;
                    socket.join(inputRoomID_);
                    console.log("room:" + inputRoomID_ + " login");
                    io.to(roomID).emit( 'into room', inputRoomID_ );
                }
                strNickname = strNickname_;
            } );

        // 新しいメッセージ受信時の処理
        // ・クライアント側のメッセージ送信時の「socket.emit( 'new message', $( '#input_message' ).val() );」に対する処理
        socket.on(
            'new message',
            ( strMessage ) =>
            {
                console.log( 'new message', strMessage );

                // 現在時刻の文字列の作成
                const strNow = makeTimeString( new Date() );

                // メッセージオブジェクトの作成
                const objMessage = {
                    strNickname: strNickname,
                    strMessage: strMessage,
                    strDate: strNow
                }

                //TEST：メッセージをDBに登録する処理
                db.serialize(() => {
                    db.run("insert into chat (content, name, comment) values (?, ?, ?)", socket.id, strNickname, strMessage);
                });

                // 送信元含む全員に送信
                io.to(roomID).emit( 'spread message', objMessage );
            } );

        socket.on(
            'matching',
            ( strId, myId ) =>
            {
                io.to(strId).emit( 'match', myId );
            });

        socket.on(
            'set',
            ( strId, firstFlg ) =>
            {
                console.log(firstFlg);
                io.to(strId).emit( 'set', firstFlg );
            });

        //攻撃時の処理
        socket.on(
            'attack',
            ( point, enemyId ) =>
            {
                // 送信元含む全員に送信
                console.log(enemyId + '→' + point);
                io.to(enemyId).emit( 'attacked', point );
            });

        //着弾時の処理
        socket.on(
            'hit',
            ( msg, enemyId ) =>
            {
                // 送信元含む全員に送信
                io.to(enemyId).emit( 'hit', msg );
            });

        //移動時の処理
        socket.on(
            'move',
            ( msg, enemyId ) =>
            {
                // 送信元含む全員に送信
                io.to(enemyId).emit( 'move', msg );
            });

        //移動時の処理
        socket.on(
            'end',
            ( enemyId ) =>
            {
                // 送信元含む全員に送信
                io.to(enemyId).emit( 'end' );
            });
            
    } );

// 公開フォルダの指定
app.use( express.static( __dirname + '/public' ) );

// サーバーの起動
server.listen(
    PORT,
    () =>
    {
        console.log( 'Server on port %d', PORT );
    } );
