const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);


var partie = {
    j1Data: {id:null, socket:null},
    j2Data: {id:null, socket:null},
    plateau: [[0,0,0],[0,0,0],[0,0,0]],
    tourj1: true 
}

io.on('connection', socket => {
    

    socket.on('play', function (data) {
        if(!partie.j1Data.id){
            partie.j1Data.id = data.id;
            partie.j1Data.socket = socket;
        } else if(!partie.j2Data.id){
            partie.j2Data.id = data.id;
            partie.j2Data.socket = socket;
        }

        if(partie.plateau[data.y-1][data.x-1]==0){
            if(data.id == partie.j1Data.id && partie.tourj1 || data.id != partie.j1Data.id && !partie.tourj1){
                var color = partie.tourj1 ? 'red' : 'green';
                var color2 = partie.tourj1 ? 'green' : 'red';

                if(partie.j1Data.id == data.id){
                    partie.j1Data.socket = socket;
                } else if(partie.j2Data == data.id){
                    partie.j2Data.socket = socket;
                }
            
                partie.j1Data.socket.emit('rcvplay', {x:data.x, y:data.y, color:color});
                partie.j2Data.socket.emit('rcvplay', {x:data.x, y:data.y, color:color2});

                partie.plateau[data.y-1][data.x-1]= (partie.tourj1) ? 1 : 2;
                partie.tourj1 = !partie.tourj1;
            }
        }
    });

    socket.on('tellLoadPlat', (data) => {
        
        socket.emit('loadPlat', partie.plateau);
    });

    socket.on('setId',(id) => {
        if(!partie.j1Data.id){
            partie.j1Data.id = id;
            partie.j1Data.socket = socket;
        } else if(!partie.j2Data.id){
            partie.j2Data.id = id;
            partie.j2Data.socket = socket;
        }
    })
   
});


app.get('/', (req,res) => {
    res.sendFile(__dirname+'/views/index.html');
});

http.listen(3000, () => {
   console.log('server start');
});

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }