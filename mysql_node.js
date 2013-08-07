var http = require('http');
var mysql = require('mysql');
function web(req, res) {
  var client = mysql.createClient();
  client.host='127.0.0.1';
  client.port= '3306';
  client.user='root';
  client.password='123456';
  client.database='games';
  client.query('SELECT * FROM guests', function(error, result, fields){
    // Если возникла ошибка выбрасываем исключение
    if (error){
      console.log(error);
    }
    // выводим результат
    var sors = '<html><body> ';
    for(var i = 0; i < result.length; i++){
      sors=sors+ '<br> Guest_'+result[i].Guest_id+' Пароль: '+result[i].Password;
    }
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write(sors);
    res.end();
  });
  // Завершаем соединение
  client.end();
}
http.createServer(web).listen(8888);
console.log('Сервер был запущен '+Date()+ ' И доступен по адресу "<a href="http://localhost:8888/">http://localhost:8888/</a>" ');