var currentGroup = $.getQueryString("group");
var currentName = $.getQueryString("name");
var currentUser = JSON.parse(localStorage.getItem("user"));

$("#renameContent").text(currentName);
$("#renameInput").attr("placeholder", currentName);

function initMembers() {
	$(".memberContent").html("");
	TLM.ajax({
		type: "post",
		url: TLM.ServiceUrl + "/IMService/GetGroupMembers.ashx",
		data: {
			"linkentityid": decodeURI(currentGroup),
			"Function": "Read",
			"EntityM": "tly_msgsession_systemuser",
			"EntityA": "tly_msgsession",
			"EntityB": "systemuser",
			//"EntityB": EntityName,
			"filter": "{\"Conditions\":[],\"FilterOperator\":\"AND\",\"Filters\":[]}",
			"order": "name asc",
			"pagenum": 0,
			"pagesize": 500,
			"ViewName": "TLM_App_GroupMember"
		},
		dataType: "json",
		success: function(data, textStatus) {
			$(data.List).each(function(i, v) {
				$(".memberContent").prepend(IM.buildIMTemplete($("#memberTemplete").html(), {
					"systemuserid": v.SystemUserId,
					"tlm_empno": v.tlm_empno,
					"userimg": TLM.ServiceUrl + v.userimg,
					"name": v.name
				}));
			})

			$("#deleteContent").html("");
			$(data.List).each(function(i, v) {
				$("#deleteContent").prepend(IM.buildIMTemplete($("#deleteTemplete").html(), {
					"systemuserid": v.SystemUserId,
					"tlm_empno": v.tlm_empno,
					"userimg": TLM.ServiceUrl + v.userimg,
					"name": v.name
				}));
			})

			$(".memberContent").append('<div><div id="btn_add" class="members"><img src="../img/add.png" /><div>&nbsp;</div></div>\
			<div id="btn_minus" class="members"><img src="../img/minus.png" /><div>&nbsp;</div></div></div>');

			$("#btn_add")[0].addEventListener("tap", function(e) {
				mui.openWindow("userlist.html?group=" + currentGroup + "&name=" + currentName, "chatUserListWebview")
				event.stopPropagation();
			})

			$("#btn_minus")[0].addEventListener("click", function(e) {
				$("#nomalPanal").hide();
				$("#deletePanal").show();
				event.stopPropagation();
			})
		},
		error: function(data) {
			console.log(JSON.stringify(data));
		}
	});
}

mui.plusReady(function() {
	initMembers();

	//加入组完成
	window.addEventListener("joinGroupDone", function(data) {
		data = data.detail;
		plus.nativeUI.closeWaiting();
		if(data.success) {
			plus.webview.getWebviewById("chatUserListWebview").close();
			initMembers();
		} else {
			mui.toast("加入组失败");
		}
	});

	//加入组失败
	window.addEventListener("joinGroupError", function(data) {
		data = data.detail;
		plus.nativeUI.closeWaiting();
		mui.toast("加入组失败!");
	});

	//删除组成员完成
	window.addEventListener("leaveGroupDone", function(data) {
		data = data.detail;
		console.log(JSON.stringify(data))
		plus.nativeUI.closeWaiting();
		if(data.success) {
			location.reload(location.href);
		} else {
			mui.toast("删除组成员失败");
		}
	});

	//删除组成员失败
	window.addEventListener("leaveGroupError", function(data) {
		data = data.detail;
		plus.nativeUI.closeWaiting();
		mui.toast("删除组成员失败!");
		console.log(JSON.stringify(data));
	});

	$("#btn_deletePanalBack")[0].addEventListener("click", function(e) {
		$("#nomalPanal").show();
		$("#deletePanal").hide();
		event.stopPropagation();
	})

	$("#btn_changeName")[0].addEventListener('click', function(e) {
		$("#nomalPanal").hide();
		$("#renamePanal").show();
		event.stopPropagation();
	});
	$("#btn_renamePanalBack")[0].addEventListener("click", function(e) {
		$("#nomalPanal").show();
		$("#renamePanal").hide();
		event.stopPropagation();
	})
	document.getElementById("btn_rename").addEventListener("click", function(e) {
		TLM.ajax({
			type: "post",
			url: TLM.ServiceUrl + "/Service/Data/SaveData.ashx",
			dataType: "JSON",
			data: {
				entityname: "tly_msgsession",
				data: '{"tly_name":"' + $("#renameInput").val() + '","tly_msgsessionid":"' + currentGroup + '"}',
				id: currentGroup
			},
			success: function(data, textStatus) {

				//storage群名称修改
				var IMStorage = JSON.parse(plus.storage.getItem("IM" + currentUser.username));

				console.log(JSON.stringify(IMStorage))
				$.grep(IMStorage, function(i) {
					return(i.id == data.ResultData)
				})[0].name = $("#renameInput").val();

				$($.grep(IMStorage, function(i) {
					return(i.id == data.ResultData)
				})[0].msgs).each(function(i, v) {
					v.groupname = $("#renameInput").val();
				})

				console.log(JSON.stringify(IMStorage))
				plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));

				var IMStorage1 = JSON.parse(plus.storage.getItem("IM" + currentUser.username));

				console.log(JSON.stringify(IMStorage1))

				//页面群名称修改
				$("#renameContent").text($("#renameInput").val())
				//列表群名称修改
				var indexcmd = "$('li[touser=" + data.ResultData + "] label').text('" + $("#renameInput").val() + "')";
				plus.webview.getWebviewById("chatIndexWebview").evalJS(indexcmd);
				//chat页面群名称修改
				var chatcmd = "$('#title').text('" + $("#renameInput").val() + "')";

				plus.webview.getWebviewById("groupchatWebview").evalJS(chatcmd);
				mui.toast("修改成功！");
			},
			error: function(data) {
				alert(1111)
			}
		});
	})

	$("#deleteContent").on("click", "li", function() {

		var currentCheckbox = $(this).find("input[type=checkbox]")

		if(currentCheckbox.is(':checked')) {
			currentCheckbox.removeAttr("checked");
		} else {
			currentCheckbox[0].checked = true;
		}
	})
	$("#btn_delete")[0].addEventListener("tap", function() {

		plus.nativeUI.showWaiting("正在移除...");
		//退出群.req:{"groupid":"组ID","members":[{"username":"用户名","fullname":"用户中文名"},{"username":"用户名","fullname":"用户中文名"}]}
		var groupreq = new Object();
		groupreq.groupid = currentGroup;
		var members = [];

		jQuery("#deleteContent li").each(function(i, v) {
			if(jQuery(this).find("input[type=checkbox]")[0].checked) {
				members.push({
					"username": jQuery(this).attr("no"),
					"fullname": jQuery(this).find("span").html()
				})
			}
		})
		groupreq.members = members;

		console.log(JSON.stringify(groupreq))
		IM.Server("leaveGroup", groupreq);

		event.stopPropagation();
		plus.nativeUI.closeWaiting();
	})

	$("#btn_delexit")[0].addEventListener("click", function() {
		var btnArray = ['否', '是'];
		mui.confirm('是否确认退出群?', '退出', btnArray, function(e) {
			if(e.index == 1) {
				plus.nativeUI.showWaiting("正在退出...");
				//console.log(JSON.stringify(currentUser));

				//退出群.req:{"groupid":"组ID","members":[{"username":"用户名","fullname":"用户中文名"},{"username":"用户名","fullname":"用户中文名"}]}
				var groupreq = new Object();
				groupreq.groupid = currentGroup;
				var members = [];

				console.log(currentUser.systemuserid);
				console.log(currentUser.name);

				members.push({
					"username": currentUser.systemuserid,
					"fullname": currentUser.name
				})
				groupreq.members = members;

				IM.Server("leaveGroup", groupreq);

				//从本地存储中删除
				var IMStorage = JSON.parse(plus.storage.getItem("IM" + currentUser.username));

				var current = $.grep(IMStorage, function(i) {
					return(i.id == currentGroup)
				});

				IMStorage.splice($.inArray(current, IMStorage), 1);
				plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));

				//从列表中删除

				var indexcmd = "$('li[touser=" + currentGroup + "]').remove()";
				plus.webview.getWebviewById("chatIndexWebview").evalJS(indexcmd);

				//关闭页面

				mui.fire(plus.webview.getWebviewById("chatIndexWebview"), "closeWindow", "groupchatWebview");
				mui.fire(plus.webview.getWebviewById("chatIndexWebview"), "closeWindow", "GroupSet");

				plus.nativeUI.closeWaiting();
			} else {

			}
		})

	})

	$("#btn_clear")[0].addEventListener("click", function() {

		var IMStorage = JSON.parse(plus.storage.getItem("IM" + currentUser.username));
		console.log(JSON.stringify(IMStorage))
		var btnArray = ['否', '是'];
		mui.confirm('是否确认清空本群聊天记录?', '清空', btnArray, function(e) {

			if(e.index == 1) {
				var sendto = currentGroup

				for(var i = 0; i < IMStorage.length; i++) {
					if(IMStorage[i].id == sendto) {
						IMStorage[i].msgs = [];
						break;
					}
				}
				plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStorage));
				mui.toast("清空聊天记录成功！");
				mui.fire(plus.webview.getWebviewById("groupchatWebview"), "clearMsgs", null);
			} else {

			}

		})
	})
})