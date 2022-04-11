var myTurnFlg = 1;
var raedyFlg = 0;
var winflag = 0;
var firstAttack = 0;

//フィールド：5×5のマス目
const field = {
    'A-1' : '0', 'B-1' : '0', 'C-1' : '0', 'D-1' : '0', 'E-1' : '0',
    'A-2' : '0', 'B-2' : '0', 'C-2' : '0', 'D-2' : '0', 'E-2' : '0', 
    'A-3' : '0', 'B-3' : '0', 'C-3' : '0', 'D-3' : '0', 'E-3' : '0', 
    'A-4' : '0', 'B-4' : '0', 'C-4' : '0', 'D-4' : '0', 'E-4' : '0', 
    'A-5' : '0', 'B-5' : '0', 'C-5' : '0', 'D-5' : '0', 'E-5' : '0'
};

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.p = x + "-" + y;
    }
}

//軍艦3種
class Ship {
    /*
    W: '3', //Warship 戦艦：ライフ３
    D: '2', //Destroyer 駆逐艦：ライフ２
    S: '1'  //Submarine 潜水艦：ライフ１
    */
    //コンストラクタ 軍艦の種類と位置   
    constructor(type, point) {
        this.type = type;
        this.point = point;
        this.life = type;
        switch (type) {
            case 3:
                document.getElementById('warship').innerHTML = this.life;
                break;
            case 2:
                document.getElementById('destroyer').innerHTML = this.life;
                break;
            case 1:
                document.getElementById('submarine').innerHTML = this.life;
                break;
        }
        
    }

    setPoint(point) {
        this.point = point
        field[point.p] = this.type;
    }

    //移動メソッド 軍艦オブジェクトと方向（方角）
    move(dest) {
        //ライフが0以上なら
        if (this.life > 0) {
            var destP;
            var nowPoint = this.point;
            var dx = this.point.x;
            var dy = this.point.y;
            switch(dest) {
                case 'E':
                    dx = String.fromCodePoint(Number(dx.charCodeAt(0)) + 1);
                    destP = new Point(dx, dy);
                    if (this.isExist(nowPoint, destP)) {
                        this.point = destP;
                        this.display (nowPoint, destP);
                    } else {
                        return false;
                    }
                    break;
                case 'W':
                    dx = String.fromCodePoint(Number(dx.charCodeAt(0)) - 1);
                    destP = new Point(dx, dy);
                    if (this.isExist(nowPoint, destP)) {
                        this.point = destP;
                        this.display (nowPoint, destP);
                    } else {
                        return false;
                    }
                    break;
                case 'N':
                    destP = new Point(dx, (Number(dy) - 1).toString());
                    if (this.isExist(nowPoint, destP)) {
                        this.point = destP;
                        this.display (nowPoint, destP);
                    } else {
                        return false;
                    }
                    break;
                case 'S':
                    destP = new Point(dx, (Number(dy) + 1).toString());
                    if (this.isExist(nowPoint, destP)) {
                        this.point = destP;
                        this.display (nowPoint, destP);
                    } else {
                        return false;
                    }
                    break;
            }

            return true;
        }
        return false;
        
    }

    isExist(nowP, destP) {
        //移動先が壁かどうか確認
        if (Number(destP.x.charCodeAt(0)) < 65 || Number(destP.x.charCodeAt(0)) > 69
            || destP.y < 1 || destP.y > 5) {
             return false;
        }
        //移動先に別の艦がないか確認
        if(field[destP.p] != 0) {
            return false;
        }
        field[nowP.p] = '0';
        field[destP.p] = this.type;
        return true;
    }

    display (nowPoint, destP) {
        var displayType;
        switch (this.type) {
            case 3:
                displayType = "W";
                break;
            case 2:
                displayType = "D";
                break;
            case 1:
                displayType = "S";
                break;
        }
        document.getElementById(nowPoint.p).innerHTML = "";
        document.getElementById(destP.p).innerHTML = displayType;
    }

    broken () {
        document.getElementById(this.point.p).innerHTML = "×";
        document.getElementById(this.point.p).style.color = "#f00";
        field[this.point.p] = -1;
        console.log(this.point.p + field[this.point.p]);
    }
}

class User {
    //ユーザは軍艦を所持
    constructor(ships) {
        this.ships = ships;
    }

    judge () {
        var j = 0;
        for (var cnt = 0; cnt < this.ships.length; cnt++) {
            j += this.ships[cnt].life;
        }
        return j;
    }

    attack (point) {
        // サーバーに、イベント名'attack' で入力テキストを送信
        socket.emit( 'attack', point, enemyId );
    }

    attacked (point) { 
        //指定されたポイントに軍艦があるか
        //軍艦がいる場合にライフを減らす
        console.log('attacked!!!!');
        console.log(point);
        // メッセージの整形
        var strText = "敵が" + "[" + point.p +"]"+ "を攻撃"

        // ログを追記
        const li_element = $( '<li id="enemyTurn">' ).text( strText );
        $( '#message_list' ).prepend( li_element );
        //所持する軍艦のリストを回す
        for (var cnt = 0; cnt < this.ships.length; cnt++) {
            //指定されたポイントと、各軍艦の位置が同じか判定
            if (point.p == this.ships[cnt].point.p) {
                //軍艦のライフが0より多ければ
                if (this.ships[cnt].life > 0) {
                    //軍艦のライフを1減らす
                    this.ships[cnt].life = this.ships[cnt].life - 1;

                    //html書き換え
                    var attackedType;
                    switch (this.ships[cnt].type) {
                        case 3:
                            attackedType = "戦艦";
                            break;
                        case 2:
                            attackedType = "駆逐艦";
                            break;
                        case 1:
                            attackedType = "潜水艦";
                            break;
                    }
                    
                    var msg = attackedType;

                    //軍艦のライフが0になったら
                    if (this.ships[cnt].life == 0) {
                        //沈没処理
                        console.log("撃沈！");
                        
                        // メッセージの整形
                        strText = attackedType+ "が撃沈された"
                        msg = msg+"を撃沈！";

                        this.ships[cnt].broken();

                        if (this.judge() == 0) {
                            document.getElementById('status').innerHTML = "";
                            document.getElementById('err').innerHTML = "敗走！ ~GAME OVER~";
                            $( '#attack_ships' ).hide();
                            $( '#move_ships' ).hide();
                            winflag = 2;
                            // サーバーに、イベント名'hit' で入力テキストを送信
                            socket.emit( 'end', enemyId );
                        }
                    } else {
                        //フィールド上
                        field[point.p] = this.ships[cnt].life;
                        // メッセージの整形
                        strText = attackedType+ "が被弾！"
                        msg = msg+"に着弾！";
                    }

                    // ログを追記
                    const li_element = $( '<li id="enemyTurn">' ).text( strText );
                    $( '#message_list' ).prepend( li_element );

                    // サーバーに、イベント名'hit' で入力テキストを送信
                    socket.emit( 'hit', msg, enemyId );

                    //html書き換え
                    switch (this.ships[cnt].type) {
                        case 3:
                            document.getElementById('warship').innerHTML = this.ships[cnt].life;
                            break;
                        case 2:
                            document.getElementById('destroyer').innerHTML = this.ships[cnt].life;
                            break;
                        case 1:
                            document.getElementById('submarine').innerHTML = this.ships[cnt].life;
                            break;
                    }
                }
            }
        }
    }
}

// 「Send」ボタンを押したときの処理
$( '#chat-form' ).submit(
    () =>
    {
        console.log( field );

        return false;   // フォーム送信はしない
    } );

// 「配置」ボタンを押したときの処理
$( '#set_ships' ).submit(
    () =>
    {
        //戦艦の配置
        var wx = $('#wx').val();
        var wy = $('#wy').val();
        var wPoint = wx + "-" + wy;
        console.log(wPoint);

        var dx = $('#dx').val();
        var dy = $('#dy').val();
        var dPoint = dx + "-" + dy;
        console.log(dPoint);
        

        var sx = $('#sx').val();
        var sy = $('#sy').val();
        var sPoint = sx + "-" + sy;
        console.log(sPoint);

        //配置が同じ軍艦がある場合
        if (wPoint == dPoint || dPoint == sPoint || sPoint == wPoint) {
            document.getElementById('err').innerHTML = "軍艦は別の位置に配置してください";
        } else {
            this.user.ships[0].setPoint(new Point(wx, wy));
            document.getElementById(wPoint).innerHTML = "W";
            this.user.ships[1].setPoint(new Point(dx, dy));
            document.getElementById(dPoint).innerHTML = "D";
            this.user.ships[2].setPoint(new Point(sx, sy));
            document.getElementById(sPoint).innerHTML = "S";
            document.getElementById('err').innerHTML = "";
            $( '#set_ships' ).hide();
            
            document.getElementById('status').innerHTML = "戦闘準備中……";
            // サーバーに、イベント名'set' で入力テキストを送信
            if (firstAttack == 0) {
                firstAttack = 1;
                socket.emit( 'set', enemyId, firstAttack );
                console.log(firstAttack);
            } else {
                socket.emit( 'set', enemyId, firstAttack );
                console.log(firstAttack);
                $( '#attack_ships' ).hide();
                $( '#move_ships' ).hide();
            }
        }

        return false;   // フォーム送信はしない
    } );

// 「攻撃」ボタンを押したときの処理
$( '#attack_ships' ).submit(
    () =>
    {
        // メッセージの整形
        const strText = "[" + $('#ax').val() + "-" + $('#ay').val() +"]"+ "を攻撃"

        // ログを追記
        const li_element = $( '<li id="myTurn">' ).text( strText );
        $( '#message_list' ).prepend( li_element );

        atkPoint = new Point ($('#ax').val() , $('#ay').val());
        console.log(atkPoint);
        user.attack( atkPoint );
        myTurnFlg = 0;

        $( '#attack_ships' ).hide();
        $( '#move_ships' ).hide();
        document.getElementById('status').innerHTML = "戦闘準備中……";

        
        return false;   // フォーム送信はしない
    } );

// 「移動」ボタンを押したときの処理
$( '#move_ships' ).submit(
    () =>
    {
        console.log( '#move_ships :' + $('#type').val() + 'to' + $('#dest').val());
        switch ($('#type').val()) {
            case '3':
                var t = 0;
                break;
            case '2':
                var t = 1;
                break;
            case '1':
                var t = 2;
                break;
        }
        
        if (user.ships[t].move($('#dest').val())){
            var type;
            switch ($('#type').val()) {
                case '3':
                    type = "戦艦";
                    break;
                case '2':
                    type = "駆逐艦";
                    break;
                case '1':
                    type = "潜水艦";
                    break;
            }
            var dest;
            switch($('#dest').val()) {
                case 'E':
                    dest = "東";
                    break;
                case 'W':
                    dest = "西";
                    break;
                case 'N':
                    dest = "北";
                    break;
                case 'S':
                    dest = "南";
                    break;
            }
            // メッセージの整形
            const strText = type + "を" + dest + "へ移動"
            // ログを追記
            const li_element = $( '<li id="myTurn">' ).text( strText );
            $( '#message_list' ).prepend( li_element );
            document.getElementById('err').innerHTML = "";

            // サーバーに、イベント名'hit' で入力テキストを送信
            socket.emit( 'move', strText, enemyId );

            $( '#attack_ships' ).hide();
            $( '#move_ships' ).hide();
            document.getElementById('status').innerHTML = "戦闘準備中……";
        } else {
            // メッセージの整形
            document.getElementById('err').innerHTML = "移動できません！";
        }

        return false;   // フォーム送信はしない
    } );

// 敵からの攻撃に対する
socket.on(
    'attacked',
    ( point ) =>
    {
        user.attacked(point, enemyId);
        if (winflag == 0) {
            $( '#attack_ships' ).show();
            $( '#move_ships' ).show();
            document.getElementById('status').innerHTML = "準備完了！行動指令を！";
        } else {
            document.getElementById('status').innerHTML = "";
        }
    } );

// 配置完了報告
socket.on(
    'set',
    ( firstFlg ) =>
    {
        console.log('firstFlg:' + firstFlg);
        if (firstFlg == 2) {
            console.log('show');
            document.getElementById('status').innerHTML = "準備完了！行動指令を！";
            $( '#attack_ships' ).show();
            $( '#move_ships' ).show();
        } else {
            console.log('hide');
            $( '#attack_ships' ).hide();
            $( '#move_ships' ).hide();
        }
        firstAttack = 2;
    } );

// 着弾報告
socket.on(
    'hit',
    ( msg ) =>
    {
        // ログを追記
        const li_element = $( '<li id="myTurn">' ).text( msg );
        $( '#message_list' ).prepend( li_element );
        document.getElementById('err').innerHTML = "";
        
    } );

// 移動報告
socket.on(
    'move',
    ( msg ) =>
    {
        msg = "敵が" + msg;
        const li_element = $( '<li id="enemyTurn">' ).text( msg );
        $( '#message_list' ).prepend( li_element );
        document.getElementById('err').innerHTML = "";
        $( '#attack_ships' ).show();
        $( '#move_ships' ).show();
        document.getElementById('status').innerHTML = "準備完了！行動指令を！";
        
    } );

socket.on(
    'end',
    () =>
    {
        if (winflag == 0) {
            // サーバーに、イベント名'hit' で入力テキストを送信
            socket.emit( 'end', enemyId );
            winflag = 1;
            document.getElementById('status').innerHTML = "";
            document.getElementById('win').innerHTML = "勝利！ ~Defeat the enemy~";
        } 

        $( '#end' ).show();
        
    } );
