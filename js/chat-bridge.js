var connection = null;
var chat = null;
var chatIndexWebviewId = "chatIndexWebview"; //列表页id
var chatWebviewId = "chatWebview"; //聊天页id
var groupchatWebviewId = "groupchatWebview"; //群聊页ID
var chatUserListWebviewId = "chatUserListWebview";
var GroupSetId = "GroupSet";
var reconnectLock = 0; //并发锁
var sitemapWebviewId = "sitemap_sub"; //应用页id
var tsqWebviewId = "tsq_sub"; //同事圈页id

function startUpSignalr() {
	if(chat != null) {
		plus.nativeUI.toast("请勿重复启动signalr");
		return;
	}

	connection = $.hubConnection();
	connection.qs = {
		'client': 'app'
	};
	connection.logging = true;
	chat = connection.createHubProxy('imhub');

	//收到系统消息
	//	chat.on('receiveSysMsg', function(msgType, msg) {
	//		mui.fire(plus.webview.getWebviewById(chatIndexWebviewId), "chat.client.systemMsg", {
	//			"msgType": msgType,
	//			"msg": msg
	//		});
	//	});

	chat.on('receiveMsg', function(msg) {
		mui.fire(plus.webview.getWebviewById(chatIndexWebviewId), "receiveMsg", msg);
		mui.fire(plus.webview.getWebviewById(chatWebviewId), "receiveMsg", msg);
	});
	chat.on('receiveSysMsg', function(msg) {
		mui.fire(plus.webview.getWebviewById(chatWebviewId), "receiveSysMsg", msg);
		mui.fire(plus.webview.getWebviewById(sitemapWebviewId), "receiveSysMsg", msg);
		mui.fire(plus.webview.getWebviewById(tsqWebviewId), "receiveSysMsg", msg);
	});
	chat.on('receiveNotice', function(msg) {
		mui.fire(plus.webview.getWebviewById(chatIndexWebviewId), "receiveNotice", msg);
	});
	//TODO:DELETE
	chat.on('sended', function(msg) {
		mui.fire(plus.webview.getWebviewById(chatIndexWebviewId), "sended", msg);
		mui.fire(plus.webview.getWebviewById(chatWebviewId), "sended", msg);
	});
	chat.on('otherLogin', function() {
		plus.nativeUI.toast("账号在别的设备上登录！");
		mui.fire(plus.webview.all()[0], 'BackToLoginPage');
	});
	chat.on('receiveGroupMsg', function(msg) {
		mui.fire(plus.webview.getWebviewById(chatIndexWebviewId), "receiveGroupMsg", msg);
		mui.fire(plus.webview.getWebviewById(groupchatWebviewId), "receiveGroupMsg", msg);
	});
	chat.on('groupCreated', function(group, members) {
		mui.fire(plus.webview.getWebviewById(chatIndexWebviewId), "groupCreated", group);
		var i=0;
		var t=setTimeout(function() {
			var ws = plus.webview.getWebviewById(groupchatWebviewId);
			if(ws != null||i++>3) {
				clearTimeout(t);
				mui.fire(ws, "groupCreated", group);
			}
		}, 500)
	});
	//连接断开
	connection.disconnected(function() {
		if(connection.state == 4 && ishavenet()) {
			setTimeout('connection.start().done(function() { console.log("重连成功！");}).fail(function(err) {});', 5000);
		}
	});
	//连接断开
	connection.reconnected(function() {

	});

	//建立连接
	connection.start().done(function() {
		console.log("Connected, transport = " + connection.transport.name);
		//打开主页
		plus.webview.currentWebview().opener().evalJS('plus.webview.create("index.html", "index.html", {popGesture: "none"});');
	}).fail(function(err) {
		plus.nativeUI.toast("signalr启动失败");
	});
}

//服务器方法映射
mui.addEventListener('chat.server.connect', function(data) {
	var postUser = data.postUser;
	chat.server.connect(postUser);
});
mui.addEventListener('send', function(msg) {
	try {
		chat.invoke('send', msg).done(function(re) {
			if(re.guid != null) {
				msg.guid = re.guid;
				msg.datetime = re.datetime;
				mui.fire(plus.webview.getWebviewById(chatIndexWebviewId), "sended", msg);
				mui.fire(plus.webview.getWebviewById(chatWebviewId), "sended", msg);
			} else {
				mui.fire(plus.webview.getWebviewById(chatWebviewId), "sendederror", msg);
				reconn("sended");
			}
		}).fail(function(e) {
			mui.fire(plus.webview.getWebviewById(chatWebviewId), "sendederror", msg);
			reconn("sended");
		})
	} catch(e) {
		mui.fire(plus.webview.getWebviewById(chatWebviewId), "sendederror", msg);
		reconn("sended");
	}
});

/*groupchat*/
//creategroup
mui.addEventListener('createGroup', function(data) {
	try {
		chat.invoke('createGroup', data).done(function(re) {
			mui.fire(plus.webview.getWebviewById(chatUserListWebviewId), "createGroupDone", re);
		}).fail(function(e) {
			mui.fire(plus.webview.getWebviewById(chatUserListWebviewId), "createGroupError", e);
			//reconn("sended");
		})
	} catch(e) {
		mui.fire(plus.webview.getWebviewById(chatUserListWebviewId), "createGroupError", e);
		//reconn("sended");
	}
});
//joingroup
mui.addEventListener('joinGroup', function(data) {
	try {
		chat.invoke('joinGroup', data).done(function(re) {
			mui.fire(plus.webview.getWebviewById(GroupSetId), "joinGroupDone", re);
		}).fail(function(e) {
			mui.fire(plus.webview.getWebviewById(GroupSetId), "joinGroupError", e);
			//reconn("sended");
		})
	} catch(e) {
		mui.fire(plus.webview.getWebviewById(GroupSetId), "joinGroupError", e);
		//reconn("sended");
	}
});
//leavegroup
mui.addEventListener('leaveGroup', function(data) {
	try {
		chat.invoke('leaveGroup', data).done(function(re) {
			mui.fire(plus.webview.getWebviewById(GroupSetId), "leaveGroupDone", re);
		}).fail(function(e) {
			mui.fire(plus.webview.getWebviewById(GroupSetId), "leaveGroupError", e);
			//reconn("sended");
		})
	} catch(e) {
		mui.fire(plus.webview.getWebviewById(GroupSetId), "leaveGroupError", e);
		//reconn("sended");
	}
});
//sendgroup
mui.addEventListener('sendToGroup', function(msg) {
	try {
		chat.invoke('sendToGroup', msg).done(function(re) {
			if(re.guid != null) {
				msg.guid = re.guid;
				msg.datetime = re.datetime;
				mui.fire(plus.webview.getWebviewById(chatIndexWebviewId), "sended", msg);
				mui.fire(plus.webview.getWebviewById(groupchatWebviewId), "sendToGroupDone", msg);
			} else {
				mui.fire(plus.webview.getWebviewById(groupchatWebviewId), "sendToGroupError", msg);
				//reconn("sended");
			}
		}).fail(function(e) {
			mui.fire(plus.webview.getWebviewById(groupchatWebviewId), "sendToGroupError", msg);
			//reconn("sended");
		})
	} catch(e) {
		mui.fire(plus.webview.getWebviewById(groupchatWebviewId), "sendToGroupError", msg);
		//reconn("sended");
	}
});

document.addEventListener("resume", function() {
	reconn("resume");
});

document.addEventListener("netchange", function() {
	var nt = plus.networkinfo.getCurrentType();
	switch(nt) {
		case plus.networkinfo.CONNECTION_ETHERNET:
		case plus.networkinfo.CONNECTION_WIFI:
		case plus.networkinfo.CONNECTION_CELL2G:
		case plus.networkinfo.CONNECTION_CELL3G:
		case plus.networkinfo.CONNECTION_CELL4G:
			reconn("netchange");
			plus.webview.getWebviewById("chatIndexWebview").evalJS('$("#no_internet").hide()');
			break;
		default:
			plus.webview.getWebviewById("chatIndexWebview").evalJS('$("#no_internet").show()');
			break;
	}
});

function ishavenet() {
	var nt = plus.networkinfo.getCurrentType();
	switch(nt) {
		case plus.networkinfo.CONNECTION_ETHERNET:
		case plus.networkinfo.CONNECTION_WIFI:
		case plus.networkinfo.CONNECTION_CELL2G:
		case plus.networkinfo.CONNECTION_CELL3G:
		case plus.networkinfo.CONNECTION_CELL4G:
			return true;
			break;
		default:
			return false;
			break;
	}
}

function reconn(flag) {
	if(connection.state == 4 && ishavenet()) {
		connection.start().done(function() {
			console.log("重连成功！");
		}).fail(function(err) {

		});
	}
}