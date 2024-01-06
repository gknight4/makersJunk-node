var utils = require('./utils')
var dgram=require('dgram')
var net=require('net')
var user=require('./users')

var cl=console.log
var dnsPort=53

// var updMessage=(m,i)=>{
//   cl(m)
// }
//
// var initUdp=()=>{
//   cl("init udp")
//   g.server = dgram.createSocket('udp4')
// //   cl(g.server)
//   g.server.on('error',e=>{
//     cl(e)
//     g.server.close()
//   })
//   g.server.on('message',(m,i)=>{ udpMessage(m,i) })
//   g.server.on('listening',l=>{
//     cl("listening")
//   })
//   g.server.bind(dnsPort,"0.0.0.0")// utils.logUdp
// //     cl("***********************logging*************************"+utils.logUdp)
// }

var makeReq=(str)=>{
  let vals=str.split(" ")
  let arr=[]
  vals.forEach(v=>{
    arr.push(Number(`0x${v}`))
  })
  return Buffer.from(arr)
}

// var sockMsg=(m,i)=>{
//   cl(m)
//   cl(i)
// }
//
// var sockErr=(e)=>{
//   cl("err")
//   cl(e)
// }

var dnsReq1="00 01 \
01 00 00 01 00 00 00 00 00 00 01 31 01 30 01 30 \
01 30 01 30 01 30 01 30 01 30 01 30 01 30 01 30 \
01 30 01 30 01 30 01 30 01 30 01 30 01 31 01 30 \
01 30 01 34 01 32 01 30 01 61 01 36 01 31 01 65 \
01 65 01 36 01 62 01 64 01 66 03 69 70 36 04 61 \
72 70 61 00 00 0c 00 01"

var dnsReq2="00 02 \
01 00 00 01 00 00 00 00 00 00 03 72 6e 32 03 74 \
72 38 02 75 73 00 00 01 00 01"

var dnsReq3="00 03 \
01 00 00 01 00 00 00 00 00 00 03 72 6e 32 03 74 \
72 38 02 75 73 00 00 1c 00 01"

var dnsConnCheck="33 43 \
01 00 00 01 00 00 00 00 00 00 11 63 6F 6E 6E 65 \
63 74 69 76 69 74 79 63 68 65 63 6B 07 67 73 74 \
61 74 69 63 03 63 6F 6D 00 00 01 00 01"

var andTime="EA 58 \
01 00 00 01 00 00 00 00 00 00 04 74 69 6D 65 07 \
61 6E 64 72 6F 69 64 03 63 6F 6D 00 00 01 00 01"

var reqEsp33="DF EE 01 00 00 01 00 00 00 00 00 00 05 65 73 70 33 33 03 63 6F 6D 00 00 01 00 01"

var myServer,myClient

var servMsg=(m,i)=>{
  cl(m.toString())
  cl(i)
  let msg=Buffer.from("and the reply")
  myServer.send(msg,i.port,i.address,servErr)
}

var servErr=(e)=>{
  if(e){
    cl("err")
    cl(e)
  }else{
    cl("sent ok")
  }

  myServer.close()
}

var servListen=()=>{
  var address = myServer.address();
  var port = address.port;
  var family = address.family;
  var ipaddr = address.address;
  console.log('Server is listening at port ' + port);
  console.log('Server ip :' + ipaddr);
  console.log('Server is IP4/IP6 : ' + family);
}

var servClose=()=>{
  cl("Server closed")
}

var udp = require('dgram');
var makeMyServer=()=>{
  myServer = udp.createSocket('udp4');
  myServer.on('error',servErr);
  myServer.on('message',servMsg)
  myServer.on('listening',servListen)
  myServer.on('close',servClose)
  myServer.bind(2123)
  cl("server made")
}

var showHex=(buf)=>{
  var ind
  for(let i=0;i<100;i++){
    let arr=[]
    for(let j=0;j<16;j++){
      ind=16*i+j
      if(ind>=buf.length){break}
      arr.push(`0${buf[ind].toString(16)}`.slice(-2))
    }
    cl(arr.join(" "))
    if(ind>=buf.length){break}
  }
}

var clientMsg=(m,i)=>{
  cl("Reply:")
  showHex(m)
}

var clientErr=(e)=>{
  if(e){
    cl("error")
    cl(e)
  }else{
//     cl("data sent")
  }
}

var makeMyClient=()=>{
  myClient=udp.createSocket('udp4');
  myClient.on("message",clientMsg)
//   let data=Buffer.from("This is the message")
//   myClient.send(data,2123,'localhost',clientErr)
}


// makeMyServer()
// makeMyClient()

var sendReq1=()=>{
  makeMyClient()
  let buf=makeReq(reqEsp33)
  let dnsHost="192.168.1.4"
  cl(`Dns Query to ${dnsHost}:`)
  showHex(buf)
//   cl(buf)
  myClient.send(buf,53,dnsHost,clientErr)
//   var sock=dgram.createSocket("udp4")
//   sock.on("message",sockMsg)
//   let buf=Buffer.from('This is a message from client')
//   sock.send(buf,53,"localhost",sockErr)

}

// sendReq1()



/**************** TCP Server *****************************/

var net=require('net')
var tcpServer
var tcpConnections=[]
var tcpPort=3201
var packs=[]
var lastMB=[]// remaining bytes not used

// var testBuf=()=>{
//   let buf=Buffer.from("now is the time for all good men to come to the aid")
// //   let arr=buf.map(e=>{return e})
//   let arr=[...buf]
//   let arr2=arr.map(x=>{return (("0"+x.toString(16)).slice(-2))})
//   for(let i=0;i<(arr2.length+15)/16;i++){
//     cl(arr2.slice(16*i,16*(i+1)).join(" "))
//   }
// }
//
// testBuf()

var MB_PACK=1000
var MB_ITEM=1001
var MB_MAC_ADDR=1002

var READ_COIL=1
var READ_DISCRETE=2
var READ_HOLDING=3
var READ_INPUT=4
var WRITE_COIL=5
var WRITE_REGISTER=6
var DIAGNOSTICS=8
var WRITE_MULTIPLE_COILS=15
var WRITE_MULTIPLE_REGISTERS=16

var MASTER=0
var SLAVE=1
var isMaster=true

var getMacAddr=(pack,connId)=>{
//   cl(pack)// xx:xx:xx:xx:xx:xx
  let str=String.fromCharCode(...pack.slice(4))
  cl(str)
  let vals=[]
  for(let i=0;i<6;i++){
    vals.push(parseInt(str.substring(3*i,3*i+2),16))
  }
  let buf=Buffer.from(vals)
  let str2=buf.toString('base64')
  cl(str2)
  let conn=tcpConnections[connId].conn
//   cl([conn.remoteFamily,conn.remoteAddress])
//   cl(vals)
//   cl(buf)
}

var processPack=(pack,connId)=>{
//   cl(pack.length)
  let cmd=pack[0]|(pack[1]<<8)
//   cl(cmd)
  if((pack[0]|(pack[1]<<8))==MB_MAC_ADDR){
//     cl("mac")
    getMacAddr(pack,connId)
  }else{
//     cl(pack)
    sendMB(pack)
  }
}

var processPacks2=()=>{// to be moved to front end
  var pack=[]

  var readWord=()=>{
    let ret=pack[0]|(pack[1]<<8)
    pack=pack.slice(2)
    return ret
  }

  var readUint=()=>{
    let ret=pack[0]|(pack[1]<<8)|(pack[2]<<16)|(pack[3]<<24)
    pack=pack.slice(4)
  }

  var readMB=()=>{
// note that this code has moved to the front end!!!
    while(lastMB.length>24){
      cl(`Read MB Length: ${lastMB.length}`)
      data=lastMB
      var res,ind
      for(let i=0;i<24;i++){
        res=0
        for(let j=0;j<2;j++){
          ind=i
          let cmd=data[ind+1]&0x7F
          data[ind+1]=cmd
          var cmdBytes
          switch(cmd){
            case READ_HOLDING:
              if(isMaster){//add:1, func:1, reg:2, num:2, crc:2
                cmdBytes=6
              }else{ //add:1, func:1, bytes:1, data: 2*bytes
                cmdBytes=3+(data[ind+2])
              }
              break
            case WRITE_REGISTER:
              if(isMaster){// add:1, func:1, reg:2, data:2
                cmdBytes=6
              }else{// add:1, func:1, reg: 2, data: 2
                cmdBytes=6
              }
              break
            case WRITE_MULTIPLE_REGISTERS:
              if(isMaster){// add:1, func:1, reg:2, count: 2, bytes: 1, data: bytes
                cmdBytes=7+(data[ind+6])
              }else{// add: 1, func: 1, reg:2, quant:2
                cmdBytes=6
              }
              break
            default:
              cmdBytes=0
              break
          }
          isMaster=!isMaster
          if(cmdBytes){
            res=checkCRC(data,ind,cmdBytes)
            if(res){
              break
            }else{
              cl(`Bad CRC:`)
              cl(data.slice(ind,ind+cmdBytes))
            }
          }
        }
        if(res){
          let endP=ind+cmdBytes+2
          let mbCmd=data.slice(ind,endP)
          lastMB=lastMB.slice(endP)
          break}
      }
    }
  }

  getMacAddr=(pack,bytes)=>{
    cl(pack,bytes)
  }


  while(packs.length){
//     cl("while packs")
    pack=pack.concat(packs[0])
//     cl(pack)
    while(pack.length){
      let cmd=readWord(pack)//pack[0]|(pack[1]<<8)
      cl(cmd)
      switch(cmd){
        case MB_PACK:
          packRem=readWord(pack)-4
//           cl(packRem)
          break
        case MB_ITEM:
          itemRem=readWord(pack)-8
//           cl(itemRem)
          timeStamp=readUint(pack)
//           cl(pack.slice(0,itemRem))
          lastMB=lastMB.concat(pack.slice(0,itemRem))
          pack=pack.slice(itemRem)
          break
        case MB_MAC_ADDR:
          let bytesRem=readWord(pack)-8
          getMacAddr(pack,bytesRem)
          break
      }
    }
//     cl(lastMB)
    readMB(lastMB)
    sendMB(lastMB)
    packs.shift(1)
//     return
  }
}

var checkCRC=(data, ind, length)=>{
//   cl(`Check CRC ind: ${ind}, length: ${length}`)
//   cl(data)
//   cl(data,ind,length)
//   data=[0x01, 0x03, 0x00, 0xd1, 0x00, 0x02, 0x94, 0x32]// 0x3294
  let crc=0xFFFF
  for(let i=0;i<length;i++){
//     cl(data[i+ind])
    crc=crc^data[i+ind]
    for(j=0;j<8;j++){
      if((crc&0x01)!=0){
        crc=crc>>1
        crc=crc^0xA001
      }else{
        crc=crc>>1
      }
    }
  }
  let crc2=data[ind+length]|(data[ind+length+1]<<8)
//   cl(crc.toString(16),crc2.toString(16))
  return crc==crc2

}

// testCRC()

var dataCnt=0

var tcpData=(e,connId)=>{

//   if(dataCnt++){return}
//   cl("data")
//   tcpConnections[connId].conn.write("ok\n")
  let arr=[...e]
  processPack(arr,connId)
  return

//   packs.push(arr)
//   processPacks()
//   let arr2=arr.map(x=>{return (("0"+x.toString(16)).slice(-2))})
//   for(let i=0;i<(arr2.length+15)/16;i++){
//     cl(arr2.slice(16*i,16*(i+1)).join(" "))
//   }
}

var tcpClose=(e,connId)=>{
  cl(`TCP Closing Connection ${connId}`)
  tcpConnections[connId].open=false
//   cl(e)
}

var tcpError=(e,connId)=>{
  cl(`TCP Error on connection ${connId}`)
  cl(e)
}

var tcpListen=()=>{
  cl(`TCP Listening on Port ${tcpPort}`)
}

var tcpConnection=(conn)=>{
//   cl(Object.keys(conn))
  cl(conn.remoteAddress)
  cl(conn.remoteFamily)
    let connId=tcpConnections.length
    conn.on('data',e=>tcpData(e,connId))
    conn.on('close',e=>tcpClose(e,connId))
    conn.on('error',e=>tcpError(e,connId))
    let co={conn:conn,connId:connId,open:true}
    tcpConnections.push(co)
    cl(`TCP New Connection ${connId}`)
  }

var makeTcpServer=()=>{
  tcpServer=net.createServer()
  tcpServer.on('connection',tcpConnection)
  tcpServer.listen(tcpPort,tcpListen)
}


/*************** WebSocket *********************/

var sendMB=(mbArr)=>{
//   cl("send mb")
//   cl(mbArr)
  if(webSockets.length){
    cl(mbArr.length)
    webSockets[webSockets.length-1].ws.send(JSON.stringify(mbArr))
  }
}

var ws=require('ws')
var mbWS
var webSockets=[]

var wsOnMessage=(r, ws)=>{
  if(!g.sessionsDB){return}
  let cmds={cRest: cRest};
  let msgObj=JSON.parse(r);
  cmds[msgObj.cmd](msgObj, ws);
}

var wsOnClose=(r, ws)=>{
  cl("on close");
}

var wsOnError=(r, ws)=>{
  cl("on error");
}


var wsOnConnect = (ws)=>{// when a new client connects
  ws.on('message', (r)=>wsOnMessage(r, ws));
  ws.on('close', (r)=>wsOnClose(r, ws))
  ws.on('error', (r)=>wsOnError(r, ws))
  let socketId=webSockets.length
  webSockets.push({ws: ws})
  ws.socketId = socketId;
}

var openWebSocket=(port,connect)=>{
  cl("Open Modbus Port "+port)
  return new Promise((r,e)=>{
    var onConnect=(ws)=>{
      cl("on connect")
      connect(ws)
      r(ws)
    }
    mbWS=new ws.Server({port:port})
    mbWS.on('connection',onConnect)
    cl("listening")
  })
}

/*OK, I think I got it:
There are *3* ports that are used:|
a tcp port that talks to the esp32
a websocket (3202) that sends the *modbus* data to the client
a websocket (3203) that handles the user interaction
note that port 3200 is being used by React
use 3201 for TCP from the ESP32

 */

var init=()=>{
  cl("init")
  makeTcpServer()
  openWebSocket(3202,wsOnConnect)

}

init()

/*************** End WebSocket *********************/

















