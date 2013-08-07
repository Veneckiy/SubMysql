
var MakeClass = function(){
    return function( args ){
        if( this instanceof arguments.callee ){
            if( typeof this.__construct == "function" ) this.__construct.apply( this, args );
        }else return new arguments.callee( arguments );
    };
};
var NewClass = function( variables, constructor, functions ){
    var retn = MakeClass();
    for( var key in variables ){
        retn.prototype[key] = variables[key];
    }
    for( var key in functions ){
        retn.prototype[key] = functions[key];
    }
    retn.prototype.__construct = constructor;
    return retn;
};
var Mysql = NewClass( {
	LibMysql: require('mysql'),
	LinkMysql: '',
	QueryLink: '',
	QueryArr: []
}, function( server,user,password,db )
{
    this.LinkMysql = this.LibMysql.createConnection({
      host     : server,
      user     : user,
      password : password,
      database : db
    });
    var CopyThis = this;
    this.LinkMysql.connect(function(err){
        CopyThis.connected(err);
    });	
    this.LinkMysql.on('error',function(e)
    {
        console.log(e);
    });
		
},{
    "connected": function(err)
    {
        if(err!==null)
        {
            console.log('MySQL connect error: '+err.code);
            process.exit(code=0);
        }
        else
        {
            console.log('MySQL connected');
        }
    },
    "getText": function()
    {
        return this.QueryLink;
    },
    "insert":function(tb)
    {
        this.QueryLink += "INSERT INTO `"+tb+"` ";
        return this;
    },
    "set":function(obj)
    {
        var tmpflds = new Array;
        var tmpvals = new Array;
        for(k in obj)
        {
            var indexar = tmpflds.length;
            tmpflds[tmpflds.length] = '`'+this.escape_string(k)+'`';
            if(typeof(obj[k])==='object')
            {
                for(subk in obj[k])
                {
                    var subindex = subk;
                    if( ! (subindex in tmpvals))
                        tmpvals[subindex] = new Array;
                    var val = null;
                    if(typeof(obj[k][subk])==='string')
                        val = "'"+this.escape_string(obj[k][subk])+"'";
                    else
                        val = obj[k][subk];
                    tmpvals[subindex][indexar] = val;
                }
            }
            else
            {
                if(! (0 in tmpvals))
                {
                    tmpvals[0] = new Array;
                }
                if(typeof(obj[k])==='string')
                {    
                    tmpvals[0][tmpvals[0].length] = "'"+this.escape_string(obj[k])+"'";
                }
                else
                {
                    tmpvals[0][tmpvals[0].length] = obj[k];
                }
            }
        }
        if(tmpflds.length)
        {
            
            for(i in tmpvals)
            {
                tmpvals[i] = "("+tmpvals[i].join(' , ')+")";
            }
            this.QueryLink += "( "+tmpflds.join(' , ')+" ) values "+tmpvals.join(',');
        }
        return this;
    },
    "select": function(ar)
    {
        this.QueryLink += "SELECT ";
        if( ar===undefined || ar.length===0 )
        {
            this.QueryLink += " * ";
        }
        else if(typeof(ar)=='string')
        {
            this.QueryLink += '`'+this.escape_string(ar)+'`';
        }
        else if(typeof(ar)=='number')
        {
            this.QueryLink += '`'+this.escape_string(ar.toString())+'`';
        }
        else
        {
            var tmp = new Array;
            for(i in ar)
            {
                tmp[tmp.length] = '`'+this.escape_string(ar[i])+'`';
            }
            this.QueryLink += ar.join(',');
        }
        return this;
    },
    "from":function(NameRes)
    {
       this.QueryLink += ' FROM ( '+this.escape_string(NameRes)+' ) ';
       return this;
    },
    "where":function(ar)
    {
        var c = '';
        var lnk = '';
        var tmp = new Array;
        tmp[tmp.length] = "1=1";
        var name = '';
        for(i in ar)
        {
            lnk = '=';
            c = i.charAt(0)+''+i.charAt(1);
            name = i;   
            switch(c)
            {
                case ">=":
                    name = i.substr(2);
                    lnk = '>= #TEXT#';
                break;
                case "<=":
                    name = i.substr(2);
                    lnk = '<= #TEXT#';
                break;
                case "<>":
                    name = i.substr(2);
                    lnk = '<> #TEXT#';
                break;
                case "()":
                    name = i.substr(2);
                    lnk = "IN";
                break;
            }
            if(lnk==='=')
            {
                c = i.charAt(0);
                switch(c)
                {
                    case "!":
                        name = i.substr(1);
                        lnk = '!= #TEXT#';
                    break;
                    case "=":
                        name = i.substr(1);
                        lnk = '= #TEXT#';
                    break;
                    case ">": 
                        name = i.substr(1);
                        lnk = '> #TEXT#';
                    break;
                    case "<":
                        name = i.substr(1);
                        lnk = '< #TEXT#';
                    break;
                    case "%":
                        name = i.substr(1);
                        lnk = 'LIKE %#TEXT#%';
                    break;
                }
            }
            if(lnk==='=')
                   lnk = "= #TEXT#";
            var str='';
            if(typeof(ar[i])==='object')
            {  
                for(val in ar[i])
                {
                    if(typeof(ar[i][val])==='string')
                    {
                        ar[i][val] = "'"+this.escape_string(ar[i][val])+"'";   
                    }
                    if(lnk!=='IN')
                    {
                        ar[i][val] =  '`'+name+'` '+lnk.replace("#TEXT#",ar[i][val]);
                    }
                }
                if(lnk==='IN')
                {   
                    str = '`'+name+'` IN ('+ar[i].join(',')+')';
                }
                else
                {
                    str += ar[i].join(' AND ');
                }
            }
            else 
            {
                if(lnk==='IN')
                {
                    lnk = "= #TEXT#";
                }
                if(typeof(ar[i])==='string')
                {
                    ar[i] = "'"+this.escape_string(ar[i])+"'";
                }
                str = '`'+name+'` '+lnk.replace("#TEXT#",ar[i]);
            }
            if(str.length>0)
            tmp[tmp.length] = str;
            
        }
        
        this.QueryLink += "WHERE "+tmp.join(" AND ");
        return this;
    },
    "exec":function(cb)
    {
        this.LinkMysql.query(this.QueryLink,function(err,res,row){
            if(cb!==undefined)
            {
                if (err)
                    cb(false);
                else 
                    cb(res);
            }
        });
        this.QueryLink = '';
        return this;
    }
    ,
    "query": function(sql,cb)
    {
          this.LinkMysql.query(sql,function(err,res,row){
            if (err)
            {
                cb(false);
            }
            else 
            {
                cb(res);
            }
        });  
    },
    "escape_string":function (s) 
    {
        return (s + '')
          .replace(/\0/g, '\\x00')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\\/g, '\\\\')
          .replace(/'/g, '\\\'')
          .replace(/"/g, '\\"')
          .replace(/\x1a/g, '\\\x1a');
    }
});
exports.connect = Mysql;