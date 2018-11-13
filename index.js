const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const session = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
});
const sharedsession = require("express-socket.io-session");


const parties = [];

var CONNEXION = [
    {name: 'coco', socket: null },
    {name: 'dd', socket: null },
    {name: 'pp', socket: null },
    {name: 'tt', socket: null },
    {name: 'mm', socket: null }
]

var players = [];

app.use(session);
io.use(sharedsession(session));

io.on('connection', socket => {
    var user_name = socket.handshake.session.user_name;
    CONNEXION.forEach(user => {
        if(user.name == user_name){
            user.socket = socket;
        }
    })

    socket.on('play', function (data) {
        var partie = getCurentGame(socket.handshake.session.user_name);
        var playerName = socket.handshake.session.user_name;
        if(partie && partie.plateau[data.y-1][data.x-1]==0){
            if(playerName == partie.j1Name && partie.tourj1 || playerName != partie.j1Name.id && !partie.tourj1){
                var color1 = partie.tourj1 ? 'red' : 'green';
                var color2 = partie.tourj1 ? 'green' : 'red';
            
                

                partie.plateau[data.y-1][data.x-1]= (partie.tourj1) ? 1 : 2;
                partie.tourj1 = !partie.tourj1;
                

                CONNEXION.forEach(user => {
                    if(partie.j1Name == user.name){
                        user.socket.emit('rcvplay', {x:data.x, y:data.y, color:color2});
                        if(isEnd(partie.plateau)){
                            partie.end=true;
                            user.socket.emit('end','Plateau Remplie');
                        }
                    } else if( partie.j2Name == user.name ){
                        user.socket.emit('rcvplay', {x:data.x, y:data.y, color:color1});
                        if(isEnd(partie.plateau)){
                            partie.end=true;
                            user.socket.emit('end','Plateau Remplie');
                        }
                    }
                });
            }
        }
    });

    socket.on('tellLoadPlat', (data) => {
        var gameFind=false;
        parties.forEach(partie => {
            if( !partie.end && (partie.j1Name == socket.handshake.session.user_name || partie.j2Name == socket.handshake.session.user_name)){
                socket.emit('loadPlat', partie.plateau);
                gameFind=true;
                console.log('rejoin game #'+ socket.handshake.session.user_name +"#");
            }
        });
        if(!gameFind){
            if( parties.length>0 && !parties[parties.length-1].j2Name){
                parties[parties.length-1].j2Name = socket.handshake.session.user_name;
                socket.emit('loadPlat', parties[parties.length-1].plateau);
                console.log('user add to game#'+ socket.handshake.session.user_name +"#");
            } else {
                console.log('create part#'+ socket.handshake.session.user_name +"#");
                var partie = {
                    j1Name: socket.handshake.session.user_name,
                    j2Name: null,
                    plateau: [[0,0,0],[0,0,0],[0,0,0]],
                    tourj1: true,
                    end:false
                }
                parties.unshift(partie);
                socket.emit('loadPlat', partie.plateau);
            }
        }
    });

    socket.on('reload', (data) => {
        var partie = getCurentGame(socket.handshake.session.user_name);
        if(partie)
            socket.emit('loadPlat', partie.plateau);
    })

    socket.on('connexion',(data) => {
        var name = data.name;
        var find=false;
        CONNEXION.forEach(element => {
            if(element.name == name){
                socket.handshake.session.user_name = name;
                element.socket = socket;
                socket.handshake.session.save();
                //console.log(socket.handshake.session);
                find=true;
                socket.emit('connexionResponse', {connected: true, name:name, message:'Connected'});
            }
        });
        if(!find)
            socket.emit('connexionResponse', {connected: false, name:name, message:'Not find'});
    });
});


app.get('/', (req,res) => {
    res.sendFile(__dirname+'/views/index.html');
});

app.get('/jeu', (req,res) => {
    res.sendFile(__dirname+'/views/jeu.html');
});

http.listen(3000, () => {
   console.log('server start on 3000');
});


function getCurentGame(user_name){
    var returnV=null;
    parties.forEach(partie => {
        if( !partie.end && (partie.j1Name == user_name || partie.j2Name == user_name)){
            returnV = partie;
        }
    });
    return returnV;
}

function isEnd(plateau){
    for(j=0;j<3;j++){
        for(k=0;k<3;k++){
            if(plateau[j][k]==0){
                return false;
            }
        }
    }
    return true;
}