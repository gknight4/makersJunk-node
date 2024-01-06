const fs = require('fs');
var ws=require('ws')
const base64url = require('base64url');
var crypto=require('crypto')

var g={
  mongoUrl:"mongo0.c2.link4cloud.com",
  mongodb: require('mongodb'),

  callStack: function(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  },

  az:(val,dec)=>{
    return ("000"+val).slice(0-dec)
  },

sendHttpPost:(host,path,body)=>{
//   cl([host,path,body])
  return new Promise((r,e)=>{
    try{
//       cl("http")
      let options={
        host: host,
        path: path,
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Content-Length':body.length,
        }
      }
//       cl(options.headers)
//       cl("http")
      let data=""
      let saveData=(chunk)=>{
        let c2=chunk.toString()
//         cl(c2)
        data+=c2
      }
      let closeResponse=()=>{
        let obj=JSON.parse(data)
//         cl(obj)
        r(obj)
//         console.log("close")
      }
      let response=(res)=>{
        if(res.statusCode==200){
          res.on('data',saveData)
          res.on('close',closeResponse)
        }else{
//           cl(res.statusCode)
          r({success:false})}
      }
      let request=https.request(options,response)
      request.on("error",err=>e(err))
      request.write(body)
      request.end()
//       cl("http")
    }catch(e){
      cl(e)
    }
  })
},

  openMongoDB: ()=>{
//     return
    let uri = 'mongodb://n3y65bTs:yhHt2WBx@' + g.mongoUrl + ':27017/?authSource=admin';
    return new Promise((res, rej)=>{
      let client = new g.mongodb.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, });
      client.connect(e=>{
          if (e === null){
            let dbName2="stage_usa"
            res(client.db(dbName2));
          } else {
            rej(false);
          }
      })
    });
  },
  openMongoColl: (db, coll)=>{
    return db.collection(coll);
  },

  mailer: require("nodemailer"),

  eMailOptions: {
    host: "smtp-relay.brevo.com",
    port: "587",
    auth: {
      type: "login",
      user: "GeneKnight4@GMail.com",
      pass: "W7HaKGV2D5nmROMg",// updated 20211118
    }
  },

  sendEmail: (mail)=>{
    let smtpTransport = g.mailer.createTransport(g.eMailOptions);
    mail.from="Link4 Cloud <l4cloud_admin@link4cloud.com>";
    smtpTransport.sendMail(mail, (e, r)=>{
      if(e){
        cl("error in SMTP: " + e);
        cl(mail)
      }else{
        cl("email sent OK");
//         cl(mail.text)
      }
      smtpTransport.close();
    })
  },

  testMail: ()=>{
    mail = {
      from: "Link4 Cloud <l4cloud_admin@link4cloud.com>",
      to: "GeneKnight4@GMail.com",
      subject: "Send Email Using Node.js",
      text: "Node.js New world for me",
      html: "<b>Node.js New world for me</b>"
    };
    g.sendEmail(mail);
  },

    createRandomString: (len)=>{
    return new Promise((res, rej)=>{
      crypto.randomBytes(Math.floor(1 + 3 * len / 4), (e, buf)=>{
        if (e === null){
          let ret = base64url.encode(buf);// substitutes -,_ for /,+ - different than front end!
          res(ret.substr(0, len));
        }else{
          rej(e)
        }
      })
    })
  },

  findPromise: (db,query,fields,limit,sort)=>{
    if(!db){return []}
    return new Promise((r, e)=>{
      if(!fields){fields={_id:0}}
      let dbFind=db.find(query).project(fields)
      if(sort){
        dbFind=dbFind.sort(sort).limit(limit)
      }else{
        if(limit){dbFind=dbFind.limit(limit)}
      }
      dbFind.toArray((er, re)=>{
        if(er){
          g.mongoError("utils findPromise",er.name)
        }else{
          r(re)
        }
      });
    });
  },


}

var cl = (m)=>{
  let dt = new Date();
  let ti = " " + g.az(dt.getHours(), 2) + ":" + g.az(dt.getMinutes(), 2) +
    ":" + g.az(dt.getSeconds(), 2);
//   console.log("a" + ti);
  let pos = 1 + __filename.lastIndexOf('/');
  let ln = g.callStack()[1].getLineNumber()
  if (typeof m === "object"){ m = JSON.stringify(m); }
  let outStr=__filename.substr(pos) + " " + ln + ti +": " + m
  console.log(outStr);
  //let stm = fs.createWriteStream("/usr/l4c2/no00/cl.txt", {flags: 'a'});
  if(g.baseDir){
	  let stm = fs.createWriteStream(`${g.baseDir}/no00/cl.txt`, {flags: 'a'});
	  stm.write(outStr+"\n", r=>{
		stm.end();
	  });
  }
}

class WebSocket{
  constructor(props){// port, sockets, msg
    cl(props)
    this.myData="what"

    var wsOnClose=(r, ws)=>{
      cl("on close");
    }

    var wsOnError=(r, ws)=>{
      cl("on error");
    }

    var onConnect=(ws)=>{//
      this.ws=ws
      cl("on connect")
      ws.on('message', (r)=>props.msg(r, ws));
      ws.on('close', (r)=>wsOnClose(r, ws))
      ws.on('error', (r)=>wsOnError(r, ws))
//       props.sockets.push({ws: ws,socketId:props.sockets.length})
    }

    this.server=new ws.Server({port:props.port})
    this.server.on('connection',onConnect)
  }
}

var msg=(msg,ws)=>{
  cl("msg")
  cl(msg.toString())
}

var testWS=async()=>{
  cl("testWS")
  let port=3203
  let sockets=[]
  let ws=new WebSocket({port:port,sockets:sockets,msg:msg,})
//   let val=await ws.ready
//   cl(val)
//   cl(ws)
}

// testWS()






module.exports = g;
module.exports.WebSocket = WebSocket
