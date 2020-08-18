const mongo = require('mongodb').MongoClient;
const socketClient = require('socket.io').listen(4000).sockets;
const dbname = 'Covid';

//conect to mongo
mongo.connect('mongodb://localhost/' + dbname, function(err,client){
    if(err){
        throw err;
        console.log('Not connected...');
    }
    var db =client.db(dbname);
    
    console.log('MongoDB connected...');

    //connect to socket.io
    socketClient.on('connection', function(socket){
        let chat = db.collection('chats');
        let countries = db.collection('countries');
        
        
        //create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        //get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if (err){
                throw err;
                console.log("no collection found...");
            }

            //emit the messges to client 
            socket.emit('output', res);
        });

         //get covid data from mongo collection
         countries.find().limit(11).toArray(function(err, res){
            if (err){
                throw err;
                console.log("no collection found...");
            }
            //console.log(res); //test print to make sure the data is being read by the server. 
            //emit the messges to client 
            socket.emit('covData', res);
        });



        

        


        // // Find a single Country for test purpose
// countries.findOne({country_name: "UK"}, function(err, countries) {
//     console.log(countries);
// });


      

        //handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            //check for name and messge
            if (name == ''|| message == ''){
                //send error status
                sendStatus('Please enter a name and message');
            }
            else {
                //insert text into database
                chat.insertOne({name: name, message: message}, function(){ 
                    client.emit('output', [data]);

                    //send status object
                    sendStatus({
                        message: 'message sent',
                        clear: true
                    });

                });
            }
        });

        //handle clear messages
        socket.on('clear', function(data){
            //remove all chats from collection
            chat.remove({}, function(){
                //emit cleared
                socket.emit('cleared');
            });

        });

    });

});

