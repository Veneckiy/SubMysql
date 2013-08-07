
// Set array for work with user
var Client_Nick = [];
var Client_IP   = [];
var Client_SSID = [];
// Set IP:PORT
var IP   = '194.28.132.208'; 
var PORT = 8888;

// Include modules and create connect  on IP:PORT
var io  = require('socket.io').listen(PORT, IP);
var mysql = require('./mysqlClass');

// Functions urlencode, urldecode
var Dec = require('./urlencode');


var mysql = mysql.connect( 'localhost','root','123456','nodejs' );

mysql.select('Name').from('CUSTOM').exec(function(res)
{
    mysql.select('Name').from('CUSTOM').where({'name':res[0].Name}).exec(function(res)
    {
        mysql.insert('CUSTOM').set({"name":["denis","elena"],"age":[19,21]}).exec();
        console.log(mysql.getText());
    });
});

var client;

io.set('log level', 0);

// New connection
io.sockets.on('connection', function (socket) 
{
	function OnLineUser(SendMe)
	{
		
		json="{'list':[";
		// Counter for json , if MY ssid will be first ( in for <i> ), then i add ',' ,but i dont add string json
		for(i=0;i<Client_SSID.length;i++)
		{
				sID = Client_SSID[i]
				nick_u = Client_Nick[sID];
				if(i>0){ json += ',';}
				json += "{'nick':'"+nick_u+"','ID':'"+sID+"'}";
			
		}
		json += "]}";
		if(Client_SSID.length>0)
		{
			if(SendMe){socket.json.emit('OnLineUser',json);}
			socket.broadcast.json.emit('OnLineUser',json);
		}
		else
		{
			json = "{'list':[]}";
			if(SendMe){socket.json.emit('OnLineUser',json);}
			socket.broadcast.json.emit('OnLineUser',json);
		}
	}
	//IP adress user
	var address = socket.handshake.address;

    // ID сокета
    var ID = (socket.id).toString();
	//console.log('new user '+ID);
	
	// get time
	var time = (new Date).toLocaleTimeString();

	
	// Add user in Client_nick
	if (typeof(Client_Nick[ID]) == 'undefined') 
	{
	//	console.log('none auth');
		socket.json.send({'event': 'messageSent', 'name': 'Server', 'text': 'Добро пожаловать в наш чат<b></b><img src=\'./cssjs/salut.gif\'> ', 'time': time});
		Client_Nick[ID]='';
	}
	
	// Function REG
	socket.on('reg',function(nick)
	{	


		var time = (new Date).toLocaleTimeString();		
		nick = Dec.Dec(nick,'d');
		nick = nick.replace('<', '&lt;').replace('>', '&gt;');
		var nick_pattern=/^[а-яА-ЯёЁa-zA-Z0-9]+$/i;
		find = nick_pattern.test(nick);
		if(find==true)
		{
			if (Client_Nick[ID] == '')
			{
				if( (nick!='') && (nick.length>2) && (nick.length<16) )
				{
					Client_Nick[ID] = nick;
					Client_IP[ID] = address.address;
					Client_SSID [Client_SSID.length] = ID; 
					// Посылаем клиенту сообщение о том, что он успешно подключился и его имя
					socket.json.send({'event': 'connected', 'name': nick+". Ваш IP: "+Client_IP[ID]+'  ', 'time': time});
					// Посылаем всем остальным пользователям, что подключился новый клиент и его имя
					socket.broadcast.json.send({'event': 'userJoined', 'name': nick, 'time': time});
					OnLineUser(true);
				}
				else
				{
					socket.json.send({'event': 'messageSent', 'name': 'Server', 'text': '<font color=\'red\'>Введите логин от 3 символов до 15</font> ', 'time': time});
				}
					
			}
			else
			{
				socket.json.send({'event': 'messageSent', 'name': 'Server', 'text': 'Вы уже в чате.', 'time': time});
			}
		}
		else
		{
			socket.json.send({'event': 'messageSent', 'name': 'Server', 'text': '<font color=\'red\'>Логин должен содержать латинские, кирилические символы,либо цифры</font> ', 'time': time});
		}
	});


	// Private 
	socket.on('private',function(msg)
	{
		msg.Message = Dec.Dec(msg.Message,'d');
		msg.Message = msg.Message.replace('<', '&lt;').replace('>', '&gt;');
		// Parse smile
		msg.Message = msg.Message.replace(/\[([0-9]+)\]/g, '<img src="cssjs/smiles/$1.gif">');
		
	//console.log('private activ'+msg.Message+"   "+ID+"   "+Client_Nick[ID]+"  "+msg.Who);
		
		io.sockets.socket(msg.Who).emit('private',msg.Message,ID,Client_Nick[ID]);


		socket.emit('PrivateSended',"<span class='user'>"+Client_Nick[ID]+"</span>: "+msg.Message,Client_Nick[msg.Who],msg.Who);
		
	});
	
	// Function PING
	socket.on('ping',function(msg)
	{
		socket.send('0');
	});


    // Навешиваем обработчик на входящее сообщение
    socket.on('message', function (msg) {
        var time = (new Date).toLocaleTimeString();
		msg = Dec.Dec(msg,'d');
		msg = msg.replace('<', '&lt;').replace('>', '&gt;');

		// Parse smile
		msg = msg.replace(/\[([0-9]+)\]/g, '<img src="cssjs/smiles/$1.gif">');
        // Пользователь не авторизован
		if ( (typeof(Client_Nick[ID]) == 'undefined') || (Client_Nick[ID]== '') ) 
		{
			socket.json.send({'event': 'messageSent', 'name': 'Server', 'text': 'Авторизуйтесь', 'time': time});
		}
		// Уведомляем клиента, что его сообщение успешно дошло до сервера
		else
		{
			socket.json.send({'event': 'messageSent', 'name': Client_Nick[ID], 'text':msg, 'time': time});
			// Отсылаем сообщение остальным участникам чата
			socket.broadcast.json.send({'event': 'messageReceived', 'name': Client_Nick[ID], 'text': msg, 'time': time,'idus':ID});
		}
    });
	
	// Cleint clicked disconnect
	socket.on('onClientDisconnect',function()
	{
		if ( (typeof(Client_Nick[ID]) != 'undefined') && (Client_Nick[ID]!= '') ) 
		{
			//console.log('disconect '+ID);
			
			// Delete array for this user
			var HowNumSSID=-1;
			for(i=0;i<Client_SSID.length;i++)
			{
				if(Client_SSID [i] == ID)
				{
					HowNumSSID=i;
					break;
				}
			}
			if(HowNumSSID>=0)
			{
			Client_Nick.splice(Client_SSID[HowNumSSID],1);
			Client_IP.splice(Client_SSID[HowNumSSID],1);
			Client_SSID.splice(HowNumSSID,1);
			//console.log('Was delete three array');
			}

			var time = (new Date).toLocaleTimeString();
			socket.broadcast.json.send({'event': 'userOff', 'name': Client_Nick[ID], 'time': time});
		}
		OnLineUser(true);
	});

    // При отключении клиента - уведомляем остальных
    socket.on('disconnect', function() 
	{
		if ( (typeof(Client_Nick[ID]) != 'undefined') && (Client_Nick[ID]!= '') ) 
		{
			//console.log('Off user '+ID);
			
			// Delete array for this user
			var HowNumSSID=-1;
			for(i=0;i<Client_SSID.length;i++)
			{
				if(Client_SSID [i] == ID)
				{
					HowNumSSID=i;
					break;
				}
			}
			if(HowNumSSID>=0)
			{
			Client_Nick.splice(Client_SSID[HowNumSSID],1);
			Client_IP.splice(Client_SSID[HowNumSSID],1);
			Client_SSID.splice(HowNumSSID,1);
			//console.log('Was delete three array');
			}

			var time = (new Date).toLocaleTimeString();
			socket.broadcast.json.send({'event': 'userSplit', 'name': Client_Nick[ID], 'time': time});
		}
		OnLineUser(true);
    });
	// Disconnect from user
	socket.on('Shutdown',function()
	{
		//console.log('Shutdown true');
		socket.disconnect();
	});
	
});

