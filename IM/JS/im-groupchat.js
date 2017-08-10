var isviewImg = false;
var picmsgcount = 0;

(function(mui, doc) {
	var lasttime = '1900/1/1';
	var lasttime_init = '1900/1/1';
	var currentUser = JSON.parse(localStorage.getItem("user"));
	var sendto = decodeURI($.getQueryString("sendto"));
	var name = decodeURI($.getQueryString("name"));
	var userimg = decodeURI($.getQueryString("userimg"));
	$("#title").text(name);

	$("#btn_GroupSet")[0].addEventListener("tap", function(e) {
		mui.openWindow("groupset.html?group=" + encodeURI(sendto) + "&name=" + encodeURI(name), "GroupSet");
	})

	var MIN_SOUND_TIME = 800;
	mui.init({
		gestureConfig: {
			tap: true, //默认为true
			doubletap: true, //默认为false
			longtap: true, //默认为false
			swipe: true, //默认为true
			drag: true, //默认为true
			hold: true, //默认为false，不监听
			release: true //默认为false，不监听
		}
	});

	mui.plusReady(function() {
		var ui = {
			body: doc.querySelector('body'),
			footer: doc.querySelector('footer'),
			footerRight: doc.querySelector('.footer-right'),
			footerLeft: doc.querySelector('.footer-left'),
			btnMsgType: doc.querySelector('#msg-type'),
			boxMsgText: doc.querySelector('#msg-text'),
			boxMsgSound: doc.querySelector('#msg-sound'),
			btnMsgImage: doc.querySelector('#msg-image'),
			areaMsgList: doc.querySelector('#msg-list'),
			boxSoundAlert: doc.querySelector('#sound-alert'),
			h: doc.querySelector('#h'),
			content: doc.querySelector('.mui-content'),
			gridImg: doc.querySelector('#grid_img'),
			photograph: doc.querySelector('#photograph')
		};

		//-------------------------     begin 处理列表点击     ------------------------

		$("#msg-list").on("tap", ".msg-item", function(e) {
			msgItemTap(this, e);
		})
		//处理点击事件
		var msgItemTap = function(msgItem, event) {
			var msgType = msgItem.getAttribute('msg-type');
			var msgContent = $(msgItem).find("[msg-content]").attr("msg-content");

			if(msgType == 30) {
				var filename = msgContent.substring(msgContent.lastIndexOf("/"), msgContent.indexOf("?"));
				var path = "_doc/mui/im" + filename;
				//判断音频文件存在否
				plus.io.resolveLocalFileSystemURL(path, function() {
					playSound(path);
				}, function(error) {
					//不存在就下载
					var download = plus.downloader.createDownload(TLM.ServiceUrl + msgContent, {
						filename: path
					}, function(download, status) {
						// 下载完成
						if(status == 200) {
							playSound(path);
						} else {
							console.log("1Download failed: " + status);
						}
					});
					download.start();
				});

				//播放本地音频
				var playSound = function(path) {
					player = plus.audio.createPlayer(path);
					var playState = msgItem.querySelector('.play-state');
					playState.innerText = '正在播放';
					player.play(function() {
						playState.innerText = '语音消息';
					}, function(e) {
						console.log("出错了：" + e.message);
						playState.innerText = '语音消息';
					});
				}
			}
		};
		//-------------------------     end 处理列表点击     --------------------------

		//-------------------------     begin 处理本地存储     ------------------------
		var IMStorage = JSON.parse(plus.storage.getItem("IM" + currentUser.username));

		//从本地存储库处理消息
		if(IMStorage != null) {
			for(var i = 0; i < IMStorage.length; i++) {
				var to = IMStorage[i].group;
				var msgs = IMStorage[i].msgs
				if(to == sendto) {
					//console.log(JSON.stringify(msgs));					
					for(var j = 0; j < msgs.length; j++) {
						var msg = msgs[j];
						//console.log(JSON.stringify(msg))
						//显示本人已发送消息
						if(msg.userimg == null) {
							msg.userimg = '';
						}

						if(msg.type == 20) {
							//var temp = $(msg.content);
							//msg.content = temp.attr("src", TLM.ServiceUrl + temp.attr("src")).prop("outerHTML");
							msg.content = IM.buildIMTemplete($("#imgTemplete").html(), {
								"sourcesrc": (TLM.ServiceUrl + msg.content)
							}).prop("outerHTML");
						}
						var msgstyle = 'msg-item-self';
						if(msg.from != currentUser.username)
							msgstyle = "";
						if(msg.from == "sys")
							msgstyle = "msg-item-sys";
						$("#msg-list").prepend(IM.buildIMTemplete($("#msgTemplete").html(), {
							"id": msg.guid,
							"self": msgstyle,
							"timeclass": "",
							"UserImg": msg.userimg.indexOf("http") >= 0 ? msg.userimg : TLM.ServiceUrl + msg.userimg,
							"content": msg.content,
							"name": msg.username,
							"time": msg.datetime,
							"type": msg.type,
							"waittingClass": "mui-hidden"
						}));
						if(j == 0 || ((new Date(lasttime_init) - new Date(msg.datetime)) > 60000) || j == (msgs.length - 1)) {

							lasttime_init = msg.datetime;
							$("#" + msg.guid).find(".addTime").show();
						}
						if(j == 0) {
							lasttime = msg.datetime;
						}
					}
					break;
				}
			}
			ui.areaMsgList.scrollTop = ui.areaMsgList.scrollHeight + ui.areaMsgList.offsetHeight;
		}
		//-------------------------     end 处理本地存储     ------------------------

		//-------------------------     begin 上传     ------------------------
		function uploader(path, callback) {
			var task = plus.uploader.createUpload(
				TLM.ServiceUrl + "/Service/Attachment/AddAttachment.ashx", {
					method: "POST",
					blocksize: 0
				},
				function(t, status) {
					if(status == 200) {
						var ret = JSON.parse(t.responseText);

						if(ret.ErrorMessage) {
							mui.toast(ret.ErrorMessage);
						} else {
							callback(ret.Result);
						}
					} else {
						mui.toast("Upload failed: ");
					}
				}
			);
			task.addFile(path, {
				key: "im"
			});
			task.addData("path", "im");
			task.start();

		}
		//-------------------------     end 上传     ------------------------

		ui.areaMsgList.scrollTop = ui.areaMsgList.scrollHeight + ui.areaMsgList.offsetHeight;

		plus.webview.currentWebview().setStyle({
			softinputMode: "adjustResize"
		});
		$("img[data-lazyload]").each(function() {
			lazyloadImg($(this), function() {});
		})
		var imageViewer = new mui.ImageViewer('.msg-content-image', {
			dbl: false
		});
		ui.h.style.width = ui.boxMsgText.offsetWidth + 'px';
		//alert(ui.boxMsgText.offsetWidth );
		var footerPadding = ui.footer.offsetHeight - ui.boxMsgText.offsetHeight;

		window.addEventListener('resize', function() {
			ui.areaMsgList.scrollTop = ui.areaMsgList.scrollHeight + ui.areaMsgList.offsetHeight;
		}, false);

		function msgTextFocus() {
			ui.boxMsgText.focus();
			setTimeout(function() {
				ui.boxMsgText.focus();
			}, 150);
		}
		//解决长按“发送”按钮，导致键盘关闭的问题；
		ui.footerRight.addEventListener('touchstart', function(event) {
			if(ui.btnMsgImage.classList.contains('mui-icon-paperplane')) {
				msgTextFocus();
				event.preventDefault();
			}
		});
		//解决长按“发送”按钮，导致键盘关闭的问题；
		ui.footerRight.addEventListener('touchmove', function(event) {
			if(ui.btnMsgImage.classList.contains('mui-icon-paperplane')) {
				msgTextFocus();
				event.preventDefault();
			}
		});
		
		ui.footerLeft.addEventListener('release', function(event) {
			 if(ui.btnMsgType.classList.contains('icon-yuyin')) {
				ui.btnMsgType.classList.add('mui-icon-compose');
				ui.btnMsgType.classList.remove('iconfont');
				ui.btnMsgType.classList.remove('icon-yuyin');
				ui.boxMsgText.style.display = 'none';
				ui.boxMsgSound.style.display = 'block';
				$('.chatitem_grid').css('display', 'none');
				ui.boxMsgText.blur();
				document.body.focus();
				ui.btnMsgImage.classList.remove('mui-icon-paperplane');
				
			} else if(ui.btnMsgType.classList.contains('mui-icon-compose')) {
				ui.btnMsgType.classList.add('iconfont');
				ui.btnMsgType.classList.add('icon-yuyin');
				ui.btnMsgType.classList.remove('mui-icon-compose');
				ui.boxMsgSound.style.display = 'none';
				ui.boxMsgText.style.display = 'block';
				$('.chatitem_grid').css('display', 'none');
				ui.boxMsgText.focus();
				setTimeout(function() {
					ui.boxMsgText.focus();
				}, 150);
				if($("#msg-text").val() != ""){
					ui.btnMsgImage.classList.add('mui-icon-paperplane');
				}
			}
		}, false);
		
		ui.footerRight.addEventListener('tap', function(event) {
			
			//发送
			if(ui.btnMsgImage.classList.contains('mui-icon-paperplane')) {
				//右侧发送按钮
				mui.fire(plus.webview.getWebviewById("chatIndexWebview"), "buildList", {
					"time": getNowFormatDate(),
					"content": '正在发送。。。',
					"user": sendto,
					"headimg": userimg,
					"username": name
				});
				ui.boxMsgText.focus();
				setTimeout(function() {
					ui.boxMsgText.focus();
				}, 150);
				event.detail.gesture.preventDefault();
				//消息为空，不发送
				if($("#msg-text").val() != "") {
					var Msg = IM.BuildMsg($.getQueryString("sendto"), 10, $("#msg-text").val());
					//显示本人已发送消息
					$("#msg-list").append(IM.buildIMTemplete($("#msgTemplete").html(), {
						"id": Msg.id,
						"self": "msg-item-self",
						"timeclass": "",
						"UserImg": Msg.userimg,
						"content": Msg.content,
						"name": Msg.username,
						"time": getNowFormatDate(),
						"type": 10,
						"waittingClass": "mui-pull-right"
					}));
					Msg.group = Msg.to;
					Msg.groupname = name;
					Msg.groupimg = userimg;
					//触发服务器端send事件
					IM.Server("sendToGroup", Msg);
				}
				ui.areaMsgList.scrollTop = ui.areaMsgList.scrollHeight + ui.areaMsgList.offsetHeight;
				ui.boxMsgText.value = '';
				mui.trigger(ui.boxMsgText, 'input', null);
				$('.chatitem_grid').css('display', 'none');
			}
			else{
				if(ui.btnMsgType.classList.contains('mui-icon-compose')) {
					ui.btnMsgType.classList.add('iconfont');
					ui.btnMsgType.classList.add('icon-yuyin');
					ui.btnMsgType.classList.remove('mui-icon-compose');
					ui.boxMsgSound.style.display = 'none';
					ui.boxMsgText.style.display = 'block';
				}
				$('#msg-text').blur();
				$('.chatitem_grid').slideToggle('fast');
				if($('.chatitem_grid').height() == "0") {
					$('#msg-list').css('padding-bottom', '155px');
				} else {
					$('#msg-list').css('padding-bottom', '50px');
				}
				ui.areaMsgList.scrollTop = ui.areaMsgList.scrollHeight + ui.areaMsgList.offsetHeight;
			}
		}, false);
		
		//图片
		ui.gridImg.addEventListener('tap', function(event) {
			plus.gallery.pick(function(path) {
				uploader(path, function(serverpath) {
					var Msg = IM.BuildMsg($.getQueryString("sendto"), 20, serverpath);
					$("#msg-list").append(IM.buildIMTemplete($("#msgTemplete").html(), {
						"id": Msg.id,
						"self": "msg-item-self",
						"timeclass": "",
						"UserImg": Msg.userimg,
						"content": IM.buildIMTemplete($("#imgTemplete").html(), {
							"sourcesrc": TLM.ServiceUrl + serverpath
						}).prop("outerHTML"),
						"name": Msg.username,
						"time": getNowFormatDate(),
						"type": 20,
						"waittingClass": "mui-pull-right"
					}));
	
					Msg.group = Msg.to;
					Msg.groupname = name;
					Msg.groupimg = userimg;
					IM.Server("sendToGroup", Msg);
				});
	
			}, function(err) {}, null);
		})
		//拍照
		ui.photograph.addEventListener('tap', function(event) {
			var cmr = plus.camera.getCamera();
			cmr.captureImage(function(path) {
				uploader("file://" + plus.io.convertLocalFileSystemURL(path), function(serverpath) {

					var Msg = IM.BuildMsg($.getQueryString("sendto"), 20, serverpath);
					$("#msg-list").append(IM.buildIMTemplete($("#msgTemplete").html(), {
						"id": Msg.id,
						"self": "msg-item-self",
						"timeclass": "",
						"UserImg": Msg.userimg,
						"content": IM.buildIMTemplete($("#imgTemplete").html(), {
							"sourcesrc": TLM.ServiceUrl + serverpath
						}).prop("outerHTML"),
						"name": Msg.username,
						"time": getNowFormatDate(),
						"type": 20,
						"waittingClass": "mui-pull-right"
					}));
					Msg.group = Msg.to;
					Msg.groupname = name;
					Msg.groupimg = userimg;
					IM.Server("sendToGroup", Msg);
				});

			}, function(err) {});
		})

		var setSoundAlertVisable = function(show) {
			if(show) {
				ui.boxSoundAlert.style.display = 'block';
				ui.boxSoundAlert.style.opacity = 1;
			} else {
				ui.boxSoundAlert.style.opacity = 0;
				//fadeOut 完成再真正隐藏
				setTimeout(function() {
					ui.boxSoundAlert.style.display = 'none';
				}, 200);
			}
		};
		var recordCancel = false;
		var recorder = null;
		var audio_tips = document.getElementById("audio_tips");
		var startTimestamp = null;
		var stopTimestamp = null;
		var stopTimer = null;
		ui.boxMsgSound.addEventListener('hold', function(event) {
			recordCancel = false;
			if(stopTimer) clearTimeout(stopTimer);
			audio_tips.innerHTML = "手指上划，取消发送";
			ui.boxSoundAlert.classList.remove('rprogress-sigh');
			setSoundAlertVisable(true);
			recorder = plus.audio.getRecorder();
			if(recorder == null) {
				plus.nativeUI.toast("不能获取录音对象");
				return;
			}
			startTimestamp = (new Date()).getTime();
			recorder.record({
				filename: "_doc/audio/"
			}, function(path) {
				if(recordCancel) return;

				uploader(path, function(serverpath) {
					var Msg = IM.BuildMsg($.getQueryString("sendto"), 30, "<div><span msg-content='" + serverpath + "?t=" + new Date().getTime() + "' class='mui-icon mui-icon-mic' style='font-size: 18px;font-weight: bold;'></span><span class='play-state'>语音消息</span></div>");
					$("#msg-list").append(IM.buildIMTemplete($("#msgTemplete").html(), {
						"id": Msg.id,
						"self": "msg-item-self",
						"timeclass": "",
						"UserImg": Msg.userimg,
						"content": Msg.content,
						"name": Msg.username,
						"time": getNowFormatDate(),
						"type": 30,
						"waittingClass": "mui-pull-right"
					}));

					Msg.group = Msg.to;
					Msg.groupname = name;
					Msg.groupimg = userimg;
					IM.Server("sendToGroup", Msg);
				});
			}, function(e) {
				plus.nativeUI.toast("录音时出现异常: " + e.message);
			});
		}, false);
		ui.body.addEventListener('drag', function(event) {
			//console.log('drag');
			if(Math.abs(event.detail.deltaY) > 50) {
				if(!recordCancel) {
					recordCancel = true;
					if(!audio_tips.classList.contains("cancel")) {
						audio_tips.classList.add("cancel");
					}
					audio_tips.innerHTML = "松开手指，取消发送";
				}
			} else {
				if(recordCancel) {
					recordCancel = false;
					if(audio_tips.classList.contains("cancel")) {
						audio_tips.classList.remove("cancel");
					}
					audio_tips.innerHTML = "手指上划，取消发送";
				}
			}
		}, false);
		ui.boxMsgSound.addEventListener('release', function(event) {
			//console.log('release');
			if(audio_tips.classList.contains("cancel")) {
				audio_tips.classList.remove("cancel");
				audio_tips.innerHTML = "手指上划，取消发送";
			}
			//
			stopTimestamp = (new Date()).getTime();
			if(stopTimestamp - startTimestamp < MIN_SOUND_TIME) {
				audio_tips.innerHTML = "录音时间太短";
				ui.boxSoundAlert.classList.add('rprogress-sigh');
				recordCancel = true;
				stopTimer = setTimeout(function() {
					setSoundAlertVisable(false);
				}, 800);
			} else {
				setSoundAlertVisable(false);
			}
			recorder.stop();
		}, false);
		ui.boxMsgSound.addEventListener("touchstart", function(e) {
			//console.log("start....");
			e.preventDefault();
		});
		ui.boxMsgText.addEventListener('input', function(event) {
			ui.btnMsgImage.classList[ui.boxMsgText.value == '' ? 'remove' : 'add']('mui-icon-paperplane');
			ui.btnMsgImage.setAttribute("for", ui.boxMsgText.value == '' ? '' : 'msg-text');
			ui.h.innerText = ui.boxMsgText.value.replace(new RegExp('\n', 'gm'), '\n-') || '-';
//			ui.footer.style.height = (ui.h.offsetHeight + footerPadding) + 'px';
//			ui.content.style.paddingBottom = ui.footer.style.height;
			ui.content.style.paddingBottom = (ui.h.offsetHeight + footerPadding) + 'px';
		});
		var focus = false;
		ui.boxMsgText.addEventListener('tap', function(event) {
			ui.boxMsgText.focus();
			setTimeout(function() {
				ui.boxMsgText.focus();
			}, 0);
			focus = true;
			setTimeout(function() {
				focus = false;
			}, 1000);
			event.detail.gesture.preventDefault();
		}, false);
		//点击消息列表，关闭键盘
		ui.areaMsgList.addEventListener('click', function(event) {
			if(!focus) {
				ui.boxMsgText.blur();
			}
		})
		//--------------------------------   事件监听     ---------------------------------
		window.addEventListener("sendToGroupDone", function(msg) {

			$("#" + msg.detail.id + " .mui-spinner").addClass("mui-hidden");

			var img = userimg.indexOf("http") >= 0 ? userimg : (TLM.ServiceUrl + userimg);

			var cmd = '$("li[touser=' + sendto + ']").find(".icon-hongdian").hide();$("li[touser=' + sendto + ']").find("#name").html("' + name + '");$("li[touser=' + sendto + ']").find("#userimg").attr("src","' + img + '")';

			plus.webview.getWebviewById("chatIndexWebview").evalJS(cmd);

			var IMStoragetemp = JSON.parse(plus.storage.getItem("IM" + currentUser.username));
			for(var i = 0; i < IMStoragetemp.length; i++) {
				if(IMStoragetemp[i].id == sendto) {
					IMStoragetemp[i].name = name;
					IMStoragetemp[i].userimg = userimg;
					break;
				}
			}

			if((new Date(msg.detail.datetime) - new Date(lasttime)) > 60000) {
				lasttime = msg.detail.datetime;
				$("#" + msg.detail.id).find(".addTime").show();
			}

			plus.storage.setItem("IM" + currentUser.username, JSON.stringify(IMStoragetemp));
			ui.areaMsgList.scrollTop = ui.areaMsgList.scrollHeight + ui.areaMsgList.offsetHeight + (msg.detail.type == 20 ? 180 : 0);

			//初始化
			$("img[data-lazyload]").each(function() {
				lazyloadImg($(this), function() {});
			})
			var imageViewer = new mui.ImageViewer('.msg-content-image', {
				dbl: false
			});
		});

		window.addEventListener("receiveGroupMsg", function(msg) {
			//alert(JSON.stringify( msg.detail));
			var CurrentUser = JSON.parse(localStorage.getItem("user"));
			if(msg.detail.type == 20) {
				msg.detail.content = IM.buildIMTemplete($("#imgTemplete").html(), {
					"sourcesrc": TLM.ServiceUrl + msg.detail.content
				}).prop("outerHTML");
			}
			if(msg.detail.type == 30) {
				var temp = $(msg.detail.content);
				//alert(temp.prop("outerHTML"))
				msg.detail.content = temp.attr("src", TLM.ServiceUrl + temp.attr("src")).prop("outerHTML");
			}
			//alert(CurrentUser.username+'xxx'+msg.detail.from);
			if(CurrentUser.username != msg.detail.from && sendto == msg.detail.group) {
				$("#msg-list").append(IM.buildIMTemplete($("#msgTemplete").html(), {
					"id": msg.detail.id,
					"self": "",
					"timeclass": "",
					"UserImg": msg.detail.userimg,
					"type": msg.detail.type,
					"content": msg.detail.content,
					"waittingClass": "mui-hidden",
					"name": msg.detail.username,
					"time": msg.detail.datetime,
				}));
				//滚动到底部
				if((new Date(msg.detail.datetime) - new Date(lasttime)) > 60000) {
					lasttime = msg.detail.datetime;
					$("#" + msg.detail.id).find(".addTime").show();
				}
			}

			plus.webview.getWebviewById("chatIndexWebview").evalJS('$("li[touser=' + sendto + ']").find(".icon-hongdian").hide();');
			ui.areaMsgList.scrollTop = ui.areaMsgList.scrollHeight + ui.areaMsgList.offsetHeight + (msg.detail.type == 20 ? 180 : 0);

			//初始化
			$("img[data-lazyload]").each(function() {
				lazyloadImg($(this), function() {});
			})
			
			picmsgcount++;
			if(msg.detail.type == 20 && isviewImg == false) {
				var imageViewer = new mui.ImageViewer('.msg-content-image', {
					dbl: false
				});
			}
		});
		window.addEventListener("groupCreated", function(group) {
			group = group.detail;
			if(sendto != group.id)
				return;
			$("#msg-list").append(IM.buildIMTemplete($("#msgTemplete").html(), {
				"id": group.id,
				"self": "msg-item-sys",
				"timeclass": "mui-hidden",
				"UserImg": group.img,
				"type": 10,
				"content": "您已被邀请加入群聊组",
				"waittingClass": "mui-hidden",
				"name": "",
				"time": group.datetime,
			}));
			//			if((new Date(msg.detail.datetime) - new Date(lasttime)) > 60000) {
			//				lasttime = msg.detail.datetime;
			//				$("#" + msg.detail.id).find(".addTime").show();
			//			}
			//滚动到底部	
		});
		window.addEventListener("sendToGroupError", function(msg) {

			$("#" + msg.detail.guid + " .mui-spinner").addClass("mui-hidden");
			$("#" + msg.detail.guid + " .unsend").show();
			ui.areaMsgList.scrollTop = ui.areaMsgList.scrollHeight + ui.areaMsgList.offsetHeight + (msg.detail.type == 20 ? 180 : 0);
		});
		//清空聊天记录
		window.addEventListener("clearMsgs", function(msg) {
			$("#msg-list").html("");
		});

	});
}(mui, document));