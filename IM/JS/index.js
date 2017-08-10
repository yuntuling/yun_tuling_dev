var currentUser = JSON.parse(localStorage.getItem("user"));

function isGuid(str) {
	return /^\w{8}-(\w{4}-){3}\w{12}$/.test(str);
}
//绑定消息列表点击事件
mui('#messages_list').on('tap', 'li', function() {
	if(isGuid($(this).attr("touser"))) //gropchat item
		mui.openWindow("im-groupchat.html?sendto=" + encodeURI($(this).attr("touser")) + "&userimg=" + encodeURI($(this).find("#userimg").attr("data-lazyload")) + "&name=" + encodeURI($(this).find("#name").text()), "groupchatWebview");
	else
		mui.openWindow("im-chat.html?sendto=" + encodeURI($(this).attr("touser")) + "&userimg=" + encodeURI($(this).find("#userimg").attr("data-lazyload")) + "&name=" + encodeURI($(this).find("#name").text()), "chatWebview");
	$(this).find(".icon-hongdian").hide();

	var _touser = $(this).attr("touser")
	var IMStorage = JSON.parse(plus.storage.getItem("IM" + currentUser.username));
	var Current = $.grep(IMStorage, function(v) {
		return v.id == _touser;
	})

	$(Current[0].msgs).each(function(i, v) {
		v.isread = true;
	})

	plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));
})

mui.plusReady(function() {
	//mui.Storage.removeItem("IM" + currentUser.username))
	var P = {};
	P.tly_push_token = plus.push.getClientInfo().token;

	P.tly_clientid = plus.push.getClientInfo().clientid;

	P.systemuserid = JSON.parse(localStorage.getItem("user")).systemuserid;
	P.tly_phone_type = mui.os.ios ? "ios" : "android";
	//保存ClientId
	TLM.ajax({
		type: "post",
		url: TLM.ServiceUrl + "/Service/Data/SaveData.ashx",
		dataType: "text",
		data: {
			entityname: "systemuser",
			data: JSON.stringify(P),
			id: JSON.parse(localStorage.getItem("user")).systemuserid
		},
		success: function(data, textStatus) {
			console.log("保存cliendid到服务器成功！")
		}
	});

	//获取公告
	TLM.ajax({
		type: "post",
		url: TLM.ServiceUrl + "/Service/Data/GetListData.ashx",
		dataType: "json",
		data: {
			entityname: 'tly_notice',
			order: 'createdon desc',
			pagenum: 0,
			pagesize: 1,
			filter: '',
			ViewName: ''
		},
		success: function(data, textStatus) {
			var lastnotice = localStorage.getItem("lastnotice");
			if(data.List.length == 0)
				return;
			if(lastnotice == null) {
				$("#notice").find(".icon-hongdian").show();
				$("#notice").find(".mui-ellipsis").html(data.List[0].tly_name);
				$("#noticetime").html(data.List[0].createdon);
				$("#notice").attr("noticeid", data.List[0].tly_noticeid);
			} else if(lastnotice != data.List[0].tly_noticeid) {
				$("#notice").find(".icon-hongdian").show();
				$("#notice").find(".mui-ellipsis").html(data.List[0].tly_name);
				$("#noticetime").html(data.List[0].createdon);
				$("#notice").attr("noticeid", data.List[0].tly_noticeid);
			} else {
				$("#notice").find(".mui-ellipsis").html(data.List[0].tly_name);
				$("#noticetime").html(data.List[0].createdon);
				$("#notice").attr("noticeid", data.List[0].tly_noticeid);
			}
		}
	});

	//绑定删除事件
	mui('#messages_list').on('tap', 'li .del', function() {
		var sendto = $(this).parent().parent().attr("touser");

		var IMStorage = JSON.parse(plus.storage.getItem("IM" + currentUser.username));
		for(var i = 0; i < IMStorage.length; i++) {
			if(IMStorage[i].id == sendto) {
				IMStorage.splice(i, 1);
				break;
			}
		}

		plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));

		$(this).parent().parent().remove();
	})

	mui.back = function() {
		if(!mui.os.ios) {
			if(confirm('确认退出？')) {
				plus.runtime.quit();
			}
		}
		return false;
	};
	//ajax获取离线消息
	var IMStorage = JSON.parse(plus.storage.getItem("IM" + currentUser.username));
	if(IMStorage == null)
		IMStorage = [];

	var parameters = [{
		"name": "username",
		"value": JSON.parse(localStorage.getItem("user")).username
	}];

	TLM.ajax({
		url: TLM.ServiceUrl + "/IMService/get_data_by_sp.ashx",
		type: "post",
		dataType: "json",
		data: {
			"sp": "sp_IM_getOffLineMsg",
			"parameters": JSON.stringify(parameters)
		},
		success: function(resultObj) {
			console.log(JSON.stringify(resultObj));

			//console.log("xxx"+plus.storage.getItem("IM" + currentUser.username))
			var offLineMsg;
			if(resultObj.ResultData != null) {
				
				offLineMsg = resultObj.ResultData.Table;

				for(var i = 0; i < offLineMsg.length; i++) {
					if(IMStorage != null && IMStorage != "null" && IMStorage != "") {

						var arr = jQuery.grep(IMStorage, function(a) {
							return a.id == (offLineMsg[i].group != null ? offLineMsg[i].group : offLineMsg[i].from);

						});

						if(arr == null || arr == "") {
							if(offLineMsg[i].group != null) {
								IMStorage.push({
									"group": offLineMsg[i].group,
									"id": offLineMsg[i].group,
									"msgs": [offLineMsg[i]],
									"name": offLineMsg[i].groupname,
									"userimg": offLineMsg[i].groupimg
								});
							} else {
								IMStorage.push({
									"group": null,
									"id": offLineMsg[i].from,
									"msgs": [offLineMsg[i]],
									"name": offLineMsg[i].username,
									"userimg": offLineMsg[i].userimg
								});
							}
						} else {
							for(var j = 0; j < IMStorage.length; j++) {
								if((offLineMsg[i].group != null ? offLineMsg[i].group : offLineMsg[i].from) == IMStorage[j].id) {
									var repeat = jQuery.grep(IMStorage[j].msgs, function(a) {
										return a.guid == offLineMsg[i].guid;
									});
									if(repeat == "" || repeat == null) {
										IMStorage[j].msgs.splice(0, 0, offLineMsg[i]);
									}
									//alert(JSON.stringify(IMStorage[j].msgs) );
									//console.log('x'+JSON.stringify(IMStorage[j].msgs))
									IMStorage[j].msgs.sort(function(a, b) {
										//console.log('x'+a.datetime+'-'+b.datetime)
										return parseInt(new Date(b.datetime).getTime()) - parseInt(new Date(a.datetime).getTime());
									})
									//console.log('y'+JSON.stringify(IMStorage[j].msgs))
								}

							}
						}
					} else {
						IMStorage = new Array();
						if(offLineMsg[i].group != null) {
							IMStorage.push({
								"group": offLineMsg[i].group,
								"id": offLineMsg[i].group,
								"msgs": [offLineMsg[i]],
								"name": offLineMsg[i].groupname,
								"userimg": offLineMsg[i].groupimg
							});
						} else {
							IMStorage.push({
								"group": null,
								"id": offLineMsg[i].from,
								"msgs": [offLineMsg[i]],
								"name": offLineMsg[i].username,
								"userimg": offLineMsg[i].userimg
							});
						}
					}
				}
			}

			for(var i = 0; i < IMStorage.length; i++) {
				if(IMStorage[i].msgs.length > IM.storageLimit) {
					IMStorage[i].msgs = IMStorage[i].msgs.slice(0, IM.storageLimit)
				}
			}


			//处理群名称
			$.each(resultObj.ResultData.Table1, function(i,v) {
				$that = v;
				var arr = jQuery.grep(IMStorage, function(a) {
					return $that.groupid == a.group
				});
				
				if(arr.length > 0) {
					arr[0].name = $that.tly_name;
					arr[0].userimg = $that.tly_avatar;
				}
			})
			
			plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));

			//从本地存储库处理消息 
			if(IMStorage != null) {
				for(var i = 0; i < IMStorage.length; i++) {
					var to = IMStorage[i].id;
					var lastmsg = null;
					var lastfrommsg = null;
					var headname = null;
					var headimg = null;
					if(IMStorage[i].msgs.length > 0)
						lastmsg = IMStorage[i].msgs[0];

					for(var j = 0; j < IMStorage[i].msgs.length; j++) {
						//alert(JSON.stringify( IMStorage[i].msgs[j]));
						if(IMStorage[i].group != null) //group
						{
							//if(IMStorage[i].msgs[j].from != JSON.parse(localStorage.getItem("user")).username&&IMStorage[i].msgs[j].guid!=IMStorage[i].id) {
							lastfrommsg = IMStorage[i].msgs[0];
							break;
							//}
						} else {
							if(IMStorage[i].msgs[j].to == JSON.parse(localStorage.getItem("user")).username) {
								lastfrommsg = IMStorage[i].msgs[j];
								break;
							}
						}
					}

					if(IMStorage[i].group != null) {
						headname = IMStorage[i].name;
						headimg = IMStorage[i].userimg;
					} else {
						headname = (lastfrommsg == null ? IMStorage[i].name : lastfrommsg.username);
						headimg = (lastfrommsg == null ? IMStorage[i].userimg : lastfrommsg.userimg);
					}
					if(headimg != null) {
						if(headimg.indexOf("http") < 0) {
							headimg = TLM.ServiceUrl + headimg;
						}
					} else {
						headimg = '';
					}
					var showContent = '';
					var msgdatetime = '';
					if(lastmsg != null) {
						showContent = lastmsg.content;
						msgdatetime = lastmsg.datetime;
						switch(lastmsg.type) {
							case 10:
								showContent = lastmsg.content;
								break;
							case 20:
								showContent = "[图片]";
								break;
							case 30:
								showContent = "[语音]";
								break;
							default:
								break;
						}
					}

					$("#messages_list").append(IM.buildIMTemplete($("#messageTemplete").html(), {
						"user": to,
						"username": headname,
						"headimg": headimg,
						"time": msgdatetime,
						"content": showContent
					}));
					$("#messages_list").find(".icon-hongdian").hide();

					//遍历离线消息
					$(offLineMsg).each(function(i, v) {
						//单聊中获取当前离线消息对应的列表中的行
						var current = $.grep(IMStorage, function(msgs) {
							var currmsg = $.grep(msgs.msgs, function(m) {
								return(m.guid == v.guid && m.isread == true)
							});
							return(currmsg.group =='' && msgs.id == v.from && currmsg.length == 0)
						})
						//如果找到，则标红
						if(current.length > 0) {
							var li = $("#messages_list li[touser=" + v.from + "]").clone();
							$("#messages_list li[touser=" + v.from + "]").remove();
							$("#messages_list").prepend(li);
							li.find(".icon-hongdian").show();
						}
						
						//群聊中获取当前离线消息对应的列表中的行
						var currentgroup = $.grep(IMStorage, function(msgs) {
							var currmsg = $.grep(msgs.msgs, function(m) {
								return(m.guid == v.guid && m.isread == true)
							});
							return(currmsg.group !='' && msgs.id == v.to && currmsg.length == 0)
						})
						//如果找到，则标红
						if(currentgroup.length > 0) {
							var li = $("#messages_list li[touser=" + v.to + "]").clone();
							$("#messages_list li[touser=" + v.to + "]").remove();
							$("#messages_list").prepend(li);
							li.find(".icon-hongdian").show();
						}
						
					})
				}
			}
			//初始化懒加载
			$("img[data-lazyload]").each(function() {
				lazyloadImg($(this), function() {});
			})
		}
	})

})

//事件处理
//接收消息处理
window.addEventListener("receiveMsg", function(MSG) {

	switch(plus.os.name) {
		case "iOS":
			if(plus.device.model.indexOf("iPhone") >= 0) {
				plus.device.vibrate();
			} else {}
			break;
		default:
			plus.device.vibrate();
			break;
	}

	var msg = MSG.detail;
	var m = $("#messages_list li[touser=" + msg.from + "]")

	var showContent = msg.content;
	switch(msg.type) {
		case 10:
			showContent = msg.content;
			break;
		case 20:
			showContent = "[图片]";
			break;
		case 30:
			showContent = "[语音]";
			break;
		default:
			break;
	}

	var options = {
		cover: false
	};
	if(IM.isBackGround) {
		plus.push.createMessage(msg.username + ":" + showContent);
	}
	if(m.length == 0) {
		$("#messages_list").prepend(IM.buildIMTemplete($("#messageTemplete").html(), {
			"user": msg.from,
			"username": msg.username,
			"headimg": msg.userimg,
			"time": msg.datetime,
			"content": showContent
		}));
	} else {
		m.find("img").attr("src", msg.userimg);
		m.find("label").html(msg.username);
		m.find("p.mui-ellipsis").html(showContent);
		m.find(".icon-hongdian").show();
		m.find("#shortTime").html(msg.datetime);
		var newmsg = m.clone();
		m.remove();
		$("#messages_list").prepend(newmsg);
	}

	//初始化懒加载
	$("img[data-lazyload]").each(function() {
		lazyloadImg($(this), function() {});
	})

	//本地存储
	var IMStorageStr = plus.storage.getItem("IM" + currentUser.username);

	if(IMStorageStr == "null") {
		var IMStorage = new Array();
		var UserMsgs = new Object();
		UserMsgs.id = msg.from;
		UserMsgs.msgs = new Array();
		UserMsgs.msgs.splice(0, 0, msg);
		IMStorage.push(UserMsgs);
		plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));

	} else {
		var IMStorage = JSON.parse(IMStorageStr);

		var currindex = null;
		var curr = null;
		for(var i = 0; i < IMStorage.length; i++) {
			var current = IMStorage[i];
			if(current.id == msg.from) {
				currindex = i;
				curr = current;
				break;
			}
		}
		if(currindex != null && curr != null) {
			IMStorage.splice(currindex, 1);
			curr.msgs.splice(0, 0, msg);
			IMStorage.splice(0, 0, curr);
		} else {
			curr = new Object();
			curr.id = msg.from;
			curr.msgs = new Array()
			curr.msgs.splice(0, 0, msg);
			IMStorage.splice(0, 0, curr);
		}

		for(var i = 0; i < IMStorage.length; i++) {
			if(IMStorage[i].msgs.length > IM.storageLimit) {
				IMStorage[i].msgs = IMStorage[i].msgs.slice(0, IM.storageLimit)
			}
		}

		plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));
	}
});
window.addEventListener("receiveGroupMsg", function(MSG) {

	switch(plus.os.name) {
		case "iOS":
			if(plus.device.model.indexOf("iPhone") >= 0) {
				plus.device.vibrate();
			} else {}
			break;
		default:
			plus.device.vibrate();
			break;
	}

	var msg = MSG.detail;
	var m = $("#messages_list li[touser=" + msg.group + "]")

	var showContent = msg.content;
	switch(msg.type) {
		case 10:
			showContent = msg.content;
			break;
		case 20:
			showContent = "[图片]";
			break;
		case 30:
			showContent = "[语音]";
			break;
		default:
			break;
	}

	if(IM.isBackGround) {
		plus.push.createMessage(msg.groupname + ":" + showContent);
	}

	msg.groupimg = (msg.groupimg.indexOf("http") < 0 ? TLM.ServiceUrl + msg.groupimg : msg.groupimg);
	if(m.length == 0) {
		$("#messages_list").prepend(IM.buildIMTemplete($("#messageTemplete").html(), {
			"user": msg.group,
			"username": msg.groupname,
			"headimg": msg.groupimg,
			"time": msg.datetime,
			"content": showContent
		}));
	} else {
		m.find("img").attr("src", msg.groupimg);
		m.find("label").html(msg.groupname);
		m.find("p.mui-ellipsis").html(showContent);
		m.find(".icon-hongdian").show();
		m.find("#shortTime").html(msg.datetime);
		var newmsg = m.clone();
		m.remove();
		$("#messages_list").prepend(newmsg);
	}
	//本地存储
	var IMStorageStr = plus.storage.getItem("IM" + currentUser.username);

	if(IMStorageStr == "null") {
		var IMStorage = new Array();
		var UserMsgs = new Object();

		UserMsgs.group = msg.group; //group only
		UserMsgs.id = msg.group;
		UserMsgs.name = msg.groupname;
		UserMsgs.userimg = msg.groupimg;

		UserMsgs.msgs = new Array();
		UserMsgs.msgs.splice(0, 0, msg);
		IMStorage.push(UserMsgs);
		plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));
	} else {
		var IMStorage = JSON.parse(IMStorageStr);

		var currindex = null;
		var curr = null;
		for(var i = 0; i < IMStorage.length; i++) {
			var current = IMStorage[i];
			if(current.id == msg.group) {
				currindex = i;
				curr = current;
				break;
			}
		}
		if(currindex != null && curr != null) {
			IMStorage.splice(currindex, 1);
			curr.msgs.splice(0, 0, msg);
			IMStorage.splice(0, 0, curr);
		} else {
			curr = new Object();
			curr.id = msg.group;
			curr.group = msg.group;
			curr.name = msg.groupname;
			curr.userimg = msg.groupimg;

			curr.msgs = new Array()
			curr.msgs.splice(0, 0, msg);
			IMStorage.splice(0, 0, curr);
		}
		plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));
	}

	//初始化懒加载
	$("img[data-lazyload]").each(function() {
		lazyloadImg($(this), function() {});
	})
});
//消息已发送处理
window.addEventListener("sended", function(MSG) {

	var msg = MSG.detail;
	var m = $("#messages_list li[touser=" + msg.to + "]")

	var showContent = msg.content;

	switch(msg.type) {
		case 10:
			showContent = msg.content;
			break;
		case 20:
			showContent = "[图片]";
			break;
		case 30:
			showContent = "[语音]";
			break;
		default:
			break;
	}
	if(m.length == 0) {
		var data = {
			"time": msg.datetime,
			"content": showContent,
			"user": msg.to
		}
		if(msg.group != null) {
			data.headimg = msg.groupimg;
			data.username = msg.groupname;
		}
		$("#messages_list").prepend(IM.buildIMTemplete($("#messageTemplete").html(), data));
	} else {
		m.find("p.mui-ellipsis").html(showContent);
		m.find("#shortTime").html(msg.datetime);
		var newmsg = m.clone();
		m.remove();
		$("#messages_list").prepend(newmsg);
	}

	//初始化
	$("img[data-lazyload]").each(function() {
		lazyloadImg($(this), function() {});
	})

	//本地存储 
	var IMStorageStr = plus.storage.getItem("IM" + currentUser.username);

	if(IMStorageStr == null || IMStorageStr == "null") {

		var IMStorage = new Array();
		var UserMsgs = new Object();
		UserMsgs.id = msg.to;

		if(msg.group != null) {
			UserMsgs.group = msg.group;
			UserMsgs.name = msg.groupname;
			UserMsgs.userimg = msg.groupimg;
		}

		UserMsgs.msgs = new Array();
		UserMsgs.msgs.splice(0, 0, msg);
		IMStorage.push(UserMsgs);
		plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));
	} else {

		var IMStorage = JSON.parse(IMStorageStr);

		var currindex = null;
		var curr = null;
		for(var i = 0; i < IMStorage.length; i++) {
			var current = IMStorage[i];
			if(current.id == msg.to) {
				currindex = i;
				curr = current;
				break;
			}
		}

		if(currindex != null && curr != null) {

			IMStorage.splice(currindex, 1);
			curr.msgs.splice(0, 0, msg);
			IMStorage.splice(0, 0, curr);

		} else {
			curr = new Object();
			curr.id = msg.to;
			if(msg.group != null) {
				curr.group = msg.group;
				curr.name = msg.groupname;
				curr.userimg = msg.groupimg;
			}
			curr.msgs = new Array()
			curr.msgs.splice(0, 0, msg);
			IMStorage.splice(0, 0, curr);
		}

		for(var i = 0; i < IMStorage.length; i++) {
			if(IMStorage[i].msgs.length > IM.storageLimit) {
				IMStorage[i].msgs = IMStorage[i].msgs.slice(0, IM.storageLimit)
			}
		}
		plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));

	}

})
//创建组通知
window.addEventListener("groupCreated", function(group) {

	group = group.detail;
	group.img = (group.img.indexOf("http") < 0 ? TLM.ServiceUrl + group.img : group.img);
	//TODO：提示被邀请进组
	var m = $("#messages_list li[touser=" + group.id + "]");
	if(m.length == 0) {
		$("#messages_list").prepend(IM.buildIMTemplete($("#messageTemplete").html(), {
			"user": group.id,
			"username": group.name,
			"headimg": group.img,
			"time": group.datetime,
			"content": "您已被邀请加入群聊组"
		}));
	} else {
		m.find("p.mui-ellipsis").html("您已被邀请加入群聊组");
		m.find("#shortTime").html(group.datetime);
		var newmsg = m.clone();
		m.remove();
		$("#messages_list").prepend(newmsg);
	}
	//本地存储 
	var IMStorageStr = plus.storage.getItem("IM" + currentUser.username);
	if(IMStorageStr == "null") {
		var IMStorage = new Array();
		var UserMsgs = new Object();
		UserMsgs.group = group.id; //group only
		UserMsgs.id = group.id;
		UserMsgs.name = group.name;
		UserMsgs.userimg = group.img;
		UserMsgs.msgs = [];
		IMStorage.push(UserMsgs);
		plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));

	} else {
		var IMStorage = JSON.parse(IMStorageStr);
		var currindex = null;
		var curr = null;
		for(var i = 0; i < IMStorage.length; i++) {
			var current = IMStorage[i];
			if(current.id == group.id) {
				currindex = i;
				curr = current;
				break;
			}
		}
		if(currindex != null && curr != null) {
			IMStorage.splice(currindex, 1);
			curr.group = group.id;
			curr.name = group.name;
			curr.userimg = group.img;
			curr.msgs = [];
			IMStorage.splice(0, 0, curr);
		} else {
			curr = new Object();
			curr.group = group.id; //group only
			curr.id = group.id;
			curr.name = group.name;
			curr.userimg = group.img;
			curr.msgs = [];
			IMStorage.splice(0, 0, curr);
		}
		plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));
	}
	//初始化懒加载
	$("img[data-lazyload]").each(function() {
		lazyloadImg($(this), function() {});
	})
});

//公告通知
window.addEventListener("receiveNotice", function(MSG) {
	var msg = MSG.detail;
	$("#notice").find(".icon-hongdian").show();
	$("#notice").find(".mui-ellipsis").html(msg.tly_name);
	$("#noticetime").html(msg.createdon.split(".")[0].replace("T", " "));
	$("#notice").attr("noticeid", msg.tly_noticeid);
});

//打开聊天界面关闭用户选择界面
window.addEventListener("delegateChatViewOpen", function(viewInfo) {

	viewInfo = viewInfo.detail;
	mui.openWindow(viewInfo.url, viewInfo.viewid);

	setTimeout(function() {
		plus.webview.getWebviewById("chatUserListWebview").hide();
		plus.webview.getWebviewById("chatUserListWebview").close();
	}, 1000);

});

//构建默认列表
window.addEventListener("buildList", function(data) {

	if($("#messages_list").find("li[touser=" + data.detail.user + "]").length > 0)
		return;

	var li = IM.buildIMTemplete($("#messageTemplete").html(), data.detail);
	$("#messages_list").prepend(IM.buildIMTemplete($("#messageTemplete").html(), data.detail));

	//初始化
	$("img[data-lazyload]").each(function() {
		lazyloadImg($(this), function() {});
	})
});

//打开聊天界面关闭用户选择界面
window.addEventListener("closeWindow", function(windowid) {
	var windowid = windowid.detail
	plus.webview.getWebviewById(windowid).close();
});