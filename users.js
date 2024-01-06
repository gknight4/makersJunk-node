var utils=require('./utils')
const fs = require('fs');
const bcrypt=require('bcrypt')
initted=false

var cl = (m)=>{
  let dt = new Date();
  let ti = " " + utils.az(dt.getHours(), 2) + ":" + utils.az(dt.getMinutes(), 2) +
    ":" + utils.az(dt.getSeconds(), 2);
  let pos = 1 + __filename.lastIndexOf('/');
  let ln = utils.callStack()[1].getLineNumber()
  if (typeof m === "object"){ m = JSON.stringify(m); }
  console.log(__filename.substr(pos) + " " + ln + ti +": " + m);
  let outStr=__filename.substr(pos) + " " + ln + ti +": " + m + "\n"
  let stm = fs.createWriteStream(`./cl.txt`, {flags: 'a'});
  stm.write(outStr, r=>{
    stm.end();
  });
}
// cl(config.components.usa)

var sockets=[]

var wsMsg=(r,ws)=>{
  cl(r)

}

var usersLogin=async(msg,ws)=>{
  cl(msg)
  if(!g.users){resp(msg,ws,{result:"notReady"}); return}
  var res={},b
  switch(msg.method){
    case "create":
      b=msg.body
      let user=await g.users.findOne({email:b.email.toLowerCase()})
      if(user){
        if(user?.activate){
          res={result:"notActivated"}
        }else{
          let hash=await bcrypt.hash(b.password,user.salt)
          if(hash==user.hash){
            let sessionId=await utils.createRandomString(32)
            res={
              name:user.name,
              userId:user.userId,
              sessionId:sessionId,
              result:"ok"}
            g.users.updateOne({userId:user.userId},
              {$set:{sessionId:sessionId,rememberMe:b.rememberMe}})
          }else{
            res={result:"notFound"}
          }
        }
      }else{
        res={result:"notFound"}
      }
      resp(msg,ws,res)
      break
    case "update":// activating new user
      b=msg.body
      let exist=await g.users.findOne(b)
      if(exist){
        cl("found act")
        g.users.update(b,{$unset:{activate:1}})
        res={result:"ok"}
      }else{
        res={result:"notFound"}
      }
      resp(msg,ws,res)
      break
    default:
      break
  }
}

var verifyReCaptcha=async(recaptchaResponse)=>{
  let secretKey="6Ld3ekIpAAAAAFpa7kBP84BQSayAsW-CPRTsH2jk"
  let body=`secret=${secretKey}&response=${recaptchaResponse}`
  res=await utils.sendHttpPost("www.google.com","/recaptcha/api/siteverify",body)
  cl(res)
  return res.success
}



var usersCreateAccount=async(msg,ws)=>{
// {"uri":"/o/createaccount","method":"create","body":{"email":"GeneKnight4@GMail.com","password":"fremont"},"key":0}
  cl(msg)
  var doActivateEmail=(activate)=>{
    let mail={
    from: "Modbus Monitor <admin@mbmonitor.com>",
    to: user.email,
    subject: "Modbus Monitor Account Activation",
    text: `Greetings!\n\
Your email has been used to create an account on MBMonitor.com, with this information:\n\
\n\
Name: ${user.name}\n\
Email: ${user.email}\n\
\n\
If you created this account, please click on this link to activate it:\n\
\n\
http://MBMonitor.com/activate.html?token=${activate}\n\
\n\
Otherwise, please ignore this message.\n\
\n\
Thanks!\n\
Gene Knight`,
          html: `Greetings!<br/>\
Your email has been used to create an account on MBMonitor.com, with this information:<br/>\
<br/>\
Name: ${user.name}<br/>\
Email: ${user.email}<br/>\
<br/>\
If you created this account, please click on this link to activate it:<br/>\
<br/>
http://MBMonitor.com/activate.html?token=${activate}<br/>\
<br/>\
Otherwise, please ignore this message.<br/>\
<br/>\
Thanks!<br/>\
Gene Knight`
    }
    cl(mail)
//     utils.sendEmail(mail);

  }
  let b=msg.body
  var res,user
  switch(msg.method){
    case "create":
      user=await g.users.findOne({email:b.email.toLowerCase()})
      if("activate" in b){
        if(user){
          doActivateEmail(user.activate)
          res={result:"ok"}
          resp(msg,ws,res)
        }
      }
      if(user){
        res={result:"userExists"}
      }else{
        let activateStr=await utils.createRandomString(32)
        let userId=await utils.createRandomString(16)
        let salt=await bcrypt.genSalt(4)
        cl(salt)
        let hash=await bcrypt.hash(b.password,salt)
        cl(hash)
        user={
          name:b.name,
          email:b.email.toLowerCase(),
//           password:b.password,
          hash:hash,
          salt:salt,
          activate:activateStr,
          userId:userId,
        }
        doActivateEmail(activateStr)
        g.users.insertOne(user)
        res={result:"ok"}
      }
      resp(msg,ws,res)
      break
    case "update":// used for reset password
      cl(b)
      if("info" in b){
        let upd={}
        if(b.name){upd.name=b.name}
        if(b.email){upd.email=b.email}
        if(b.password){
          upd.salt=await bcrypt.genSalt(4)
          upd.hash=await bcrypt.hash(b.password,salt)
        }
        cl(upd)
        g.users.updateOne({userId:b.userId},{$set:upd})
        res={result:"ok"}
        resp(msg,ws,res)
        break
      }
      if("email" in b){// requesting reset
        let user=await g.users.findOne({email:b.email.toLowerCase()})
        if(user){
          cl(user)
          let resetStr=await utils.createRandomString(32)
          let mail={
            from: "Modbus Monitor <admin@mbmonitor.com>",
            to: user.email,
            subject: "Password Reset Request",
            text: `A Password Reset has been requested on your account on MBMonitor.com.\n\
\n\
If you made this request, then please click on the link below, which will take you to a page\n\ where you can enter a new password.\n\
\n\
http://MBMonitor.com/createaccount.html?token=${resetStr}\n\
\n\
Otherwise, please ignore this message.\n\
\n\
Thanks!\n\
Gene Knight`,
          html: `A Password Reset has been requested on your account on MBMonitor.com.<br/>\
<br/>\
If you made this request, then please click on the link below, which will take you to a page where you can enter a new password.<br/>\
<br/>\
http://MBMonitor.com/createaccount.html?token=${resetStr}<br/>\
<br/>\
Otherwise, please ignore this message.<br/>\
<br/>\
Thanks!<br/>\
Gene Knight`
          }
          utils.sendEmail(mail);
          g.users.updateOne({email:b.email.toLowerCase()},{$set:{reset:resetStr}})
          res={result:"ok"}
          resp(msg,ws,res)
          break
        }
      }
      if("reset" in b){// doing reset
        let user=await g.users.findOne({reset:b.reset})
        cl(user)
        cl("reset")
        let salt=await bcrypt.genSalt(4)
        cl(salt)
        let hash=await bcrypt.hash(b.password,salt)
        g.users.updateOne({reset:b.reset},{
          $set:
          {
            salt:salt,
            hash:hash,
          },
          $unset:{reset:1}
        }
)
        res={result:"ok"}
        resp(msg,ws,res)
        break
      }
      res={result:"notFound"}
      resp(msg,ws,res)
      break
    default:
      break
  }
}

var resp=(msg,ws,resp)=>{
  let obj={key:msg.key,resp:resp}
  ws.send(JSON.stringify(obj))
}

var usersDevices=async(msg,ws)=>{
  cl(msg)
  cl(initted)
  let b=msg.body
  if(!g.users){
    res={result:"ok"}
    resp(msg,ws,res)
  }
//   cl(b)
  switch(msg.method){
    case "create":
      break
    case "retrieve":
      let query={userId:msg.user.userId}
      let devices=await utils.findPromise(g.devices,query)
      res={result:"ok",devices:devices}
      resp(msg,ws,res)
      break
    case "update":
      let upds=[]
      b.forEach(d=>{
        d.userId=msg.user.userId
        upds.push({
          updateOne:{
            filter:{deviceId:d.deviceId},
            update:{
              $set:d
            },
            upsert:true
          }
        })
      })
      if(upds.length){g.devices.bulkWrite(upds)}
      res={result:"ok"}
      resp(msg,ws,res)
      break
    case "delete":
      let dels=[]
      b.forEach(d=>{
        dels.push(d.deviceId)
      })
      g.devices.removeMany({deviceId:{$in:dels}})
      res={result:"ok"}
      resp(msg,ws,res)
      break
  }
}

var usersBusses=async(msg,ws)=>{
  cl(msg)
  cl(initted)
  let b=msg.body
  if(!g.users){
    res={result:"ok"}
    resp(msg,ws,res)
  }
//   cl(b)
  switch(msg.method){
    case "create":
      break
    case "retrieve":
      let query={userId:msg.user.userId}
      let busses=await utils.findPromise(g.busses,query)
      res={result:"ok",busses:busses}
      resp(msg,ws,res)
      break
    case "update":
      let upds=[]
      b.forEach(d=>{
        d.userId=msg.user.userId
        upds.push({
          updateOne:{
            filter:{busId:d.busId},
            update:{
              $set:d
            },
            upsert:true
          }
        })
      })
      if(upds.length){g.busses.bulkWrite(upds)}
      res={result:"ok"}
      resp(msg,ws,res)
      break
    case "delete":
      let dels=[]
      b.forEach(d=>{
        dels.push(d.busId)
      })
      g.busses.removeMany({busId:{$in:dels}})
      res={result:"ok"}
      resp(msg,ws,res)
      break
  }
}

var usersRegisters=async(msg,ws)=>{
  cl(msg)
  cl(initted)
  let b=msg.body
  if(!g.users){
    res={result:"ok"}
    resp(msg,ws,res)
  }
  switch(msg.method){
    case "retrieve":
      let query={userId:msg.user.userId}
      let registers=await utils.findPromise(g.registers,query)
      res={result:"ok",registers:registers}
      resp(msg,ws,res)
      break
    case "update":
      let upds=[]
      b.forEach(r=>{
        r.userId=msg.user.userId
        upds.push({
          updateOne:{
            filter:{registerId:r.registerId},
            update:{
              $set:r
            },
            upsert:true
          }
        })
      })
      if(upds.length){g.registers.bulkWrite(upds)}
      res={result:"ok"}
      resp(msg,ws,res)
      break
//     case "delete":
//       let dels=[]
//       b.forEach(d=>{
//         dels.push(d.deviceId)
//       })
//       g.devices.removeMany({deviceId:{$in:dels}})
//       res={result:"ok"}
//       resp(msg,ws,res)
//       break
  }
}

var usersMonitors=async(msg,ws)=>{
  cl(msg)
  cl(initted)
  let b=msg.body
  if(!g.users){
    res={result:"ok"}
    resp(msg,ws,res)
  }
  switch(msg.method){
    case "retrieve":
      let query={userId:msg.user.userId}
      let monitors=await utils.findPromise(g.monitors,query)
      res={result:"ok",monitors:monitors}
      resp(msg,ws,res)
      break
    case "update":
      let upds=[]
      b.forEach(r=>{
        r.userId=msg.user.userId
        upds.push({
          updateOne:{
            filter:{monitorId:r.monitorId},
            update:{
              $set:r
            },
            upsert:true
          }
        })
      })
      if(upds.length){g.monitors.bulkWrite(upds)}
      res={result:"ok"}
      resp(msg,ws,res)
      break
    case "delete":
      let dels=[]
      b.forEach(d=>{
        dels.push(d.monitorId)
      })
      g.monitors.removeMany({monitorId:{$in:dels}})
      res={result:"ok"}
      resp(msg,ws,res)
      break
  }
}

var usersInstDevs=async(msg,ws)=>{
  cl(msg)
  cl(initted)
  let b=msg.body
  if(!g.users){
    res={result:"ok"}
    resp(msg,ws,res)
  }
  switch(msg.method){
    case "retrieve":
      let query={userId:msg.user.userId}
      let instDevs=await utils.findPromise(g.instDevs,query)
      res={result:"ok",instDevs:instDevs}
      resp(msg,ws,res)
      break
    case "update":
      let upds=[]
      b.forEach(r=>{
        r.userId=msg.user.userId
        upds.push({
          updateOne:{
            filter:{instDevId:r.instDevId},
            update:{
              $set:r
            },
            upsert:true
          }
        })
      })
      if(upds.length){g.instDevs.bulkWrite(upds)}
      res={result:"ok"}
      resp(msg,ws,res)
      break
    case "delete":
      let dels=[]
      cl(b)
      b.forEach(d=>{
        dels.push(d.instDevId)
      })
      cl(dels)
      g.instDevs.removeMany({instDevId:{$in:dels}})
      res={result:"ok"}
      resp(msg,ws,res)
      break
  }
}

var gotUser=async(obj)=>{
  cl(initted)
  if(!g.users){return[]}
  cl("still")
  let user=await g.users.findOne({sessionId:obj.sessionId})
  obj.user=user
//   cl(user)
//   cl(obj)
  return user
}

var msg=async(msg,ws)=>{
//   cl("msg")
  cl(msg.toString())
  let obj=JSON.parse(msg.toString())
  uris={"/o/login":usersLogin,"/o/createaccount":usersCreateAccount}
  suris={"/s/devices":usersDevices,"/s/registers":usersRegisters,
    "/s/busses":usersBusses,"/s/instDevs":usersInstDevs,
    "/s/monitors":usersMonitors}
  if(obj.uri in uris){
    uris[obj.uri](obj,ws)
    return
  }
  if(obj.uri in suris){
    if((obj.sessionId)&&(await gotUser(obj))){
      suris[obj.uri](obj,ws)
    }else{
      cl("Bad Session ID")
    }
    return
 }
//   else{
  cl(`Unrecognized URI: ${obj.uri}`)
//   }
}

var openWS=()=>{
  cl("testWS")
  let port=3203
  let ws=new utils.WebSocket({port:port,msg:msg,})
}

var openMongo=async ()=>{
  g.db=await utils.openMongoDB()
  g.users = utils.openMongoColl(g.db, 'users');
  g.devices = utils.openMongoColl(g.db, 'devices');
  g.registers = utils.openMongoColl(g.db, 'registers');
  g.busses = utils.openMongoColl(g.db, 'busses');
  g.instDevs = utils.openMongoColl(g.db, 'instDevs');
  g.monitors = utils.openMongoColl(g.db, 'monitors');
//     utils.openMongoDB().then(db=>{
//       g.db = db;
//       g.users = utils.openMongoColl(db, 'users');
//       g.devices = utils.openMongoColl(db, 'devices');
//       g.busses = utils.openMongoColl(db, 'busses');
//       g.monitors = utils.openMongoColl(db, 'monitors');
//     }, e=>{cl(e)})
}

// var openMongo=async ()=>{
//   let db=utils.openMongoDB()
//     utils.openMongoDB().then(db=>{
//       g.db = db;
//       g.users = utils.openMongoColl(db, 'users');
//       g.devices = utils.openMongoColl(db, 'devices');
//       g.busses = utils.openMongoColl(db, 'busses');
//       g.monitors = utils.openMongoColl(db, 'monitors');
//     }, e=>{cl(e)})
// }

let g={
  init:async()=>{
    cl("initting")
    await openWS()
    await openMongo()
    initted=true
  }
}


g.init()

