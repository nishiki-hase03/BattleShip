// クライアントからサーバーへの接続要求
const socket = io.connect();
var enemyId = 0;
var matchFlg = 0;
var user;

// 接続時の処理
// ・サーバーとクライアントの接続が確立すると、
// 　サーバー側で、'connection'イベント
// 　クライアント側で、'connect'イベントが発生する
socket.on(
    'connect',
    () =>
    {
        console.log( 'connect' );
    } );

// 「Join」ボタンを押したときの処理
$( '#join-form' ).submit(
    () =>
    {
        console.log( '#input_nickname :', $( '#input_nickname' ).val() );

        if( $( '#input_nickname' ).val() )
        {
            if( $( '#input_room_id' ).val() != '' )
            {
                // サーバーに、イベント名'join' で入力テキストを送信
                socket.emit( 'join', $( '#input_nickname' ).val(), $( '#input_room_id' ).val() );
            } else {
                // サーバーに、イベント名'join' で入力テキストを送信
                socket.emit( 'join', $( '#input_nickname' ).val(), '' );
            }
            

            $( '#nickname' ).html( $( '#input_nickname' ).val() );
        }

        return false;   // フォーム送信はしない
    } );

// 「Send」ボタンを押したときの処理
$( 'form' ).submit(
    () =>
    {
        console.log( '#input_message :', $( '#input_message' ).val() );

        if( $( '#input_message' ).val() )
        {
            // サーバーに、イベント名'new message' で入力テキストを送信
            socket.emit( 'new message', $( '#input_message' ).val() );

            $( '#input_message' ).val( '' );    // テキストボックスを空に。
        }
        return false;   // フォーム送信はしない
    } );

// サーバーからのメッセージに対する処理
socket.on(
    'spread message',
    ( objMessage ) =>
    {
        console.log( 'spread message :', objMessage );

        // メッセージの整形
        const strText =　'[' + objMessage.strNickname + '] ' + objMessage.strMessage;

        // メッセージリストに追加
        const li_element = $( '<li id="chat">' ).text( strText );
        $( '#message_list' ).prepend( li_element );
    } );

// roomID表示処理
socket.on(
    'into room',
    ( strId ) =>
    {
        if (matchFlg == 0) {
            console.log("*********************" + strId + "*********************");
            // メッセージの整形
            const strText = "roomID：" + strId;

            document.getElementById('roomID').innerHTML = strText;
            console.log(strText);
            var ships = [
                new Ship(3, new Point(3,3)),
                new Ship(2, new Point(2,2)),
                new Ship(1, new Point(1,1))
            ];
            user = new User(ships);
            $( '#join-screen' ).hide();
            $( '#main-screen' ).show();
            $( '#battle-screen' ).hide();
            $( '#attack_ships' ).hide();
            $( '#move_ships' ).hide();
            document.getElementById('status').innerHTML = "航海中……";
            $( '#end' ).hide();
        }
        
    } );

// roomID表示処理
socket.on(
    'match',
    ( strId ) =>
    {
        if (matchFlg == 0) {
            matchFlg = 1;
            console.log("マッチングしました！→" + strId);
            console.log("my id →" + socket.id );
            enemyId = strId;
            socket.emit( 'matching', strId, socket.id );
            document.getElementById('status').innerHTML = "敵影を発見！配置指令を！";
            $( '#battle-screen' ).show();
        } 
    } );

