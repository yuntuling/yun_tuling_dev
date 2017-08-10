function QRCodeMarkSuccess(type, result, file) {
	UpdateVersion(result);
}

//安装更新
function UpdateVersion(wgtUrl) {
	plus.nativeUI.showWaiting("请稍后,正在更新资源...", {
		"back": "none"
	});
	plus.downloader.createDownload(wgtUrl, {
		filename: "_doc/update/"
	}, function(d, status) {
		if(status == 200) {
			plus.runtime.install(
				d.filename, {
					force: true
				},
				function() {
					plus.nativeUI.closeWaiting();
					plus.nativeUI.toast("资源更新完成");
					plus.runtime.restart();

				},
				function(e) {
					mui.toast("资源更新失败[" + e.code + "]：" + e.message);
				}
			);
		} else {
			mui.alert("下载更新失败！");
			if(!!JSON.parse(window.localStorage.user).systemuserid) {
				plus.webview.create("index.html", "index.html", {
					popGesture: "none"
				});
			} else {
				mui.toast('登陆不成功，当前版本不适用于您的账号');
			}
		}
	}).start();
}

//检查更新
function CheckUpdate(wgtversion, wgturl) {

	//获取本地应用资源版本号
	if(!wgtversion || !wgturl || wgtversion.length <= 0 || wgturl.length <= 0) {
		IMLogin();
		return false
	};
	plus.runtime.getProperty(plus.runtime.appid, function(inf) {
		localStorage.appversion = inf.version;
		if(inf.version == "0.0.0") {
			IMLogin();
			return;
		}
		var NeedUpdateFlag = false;
		NeedUpdateFlag = wgtversion.length > 0 && wgtversion != inf.version;
		if(NeedUpdateFlag) {
			UpdateVersion(wgturl);
		} else {
			IMLogin();
		}
	});
}

function NeedUpdate(wgtVersion, CurrentVersion) {
	var wgtv = wgtVersion.split('.');
	var infv = CurrentVersion.split('.');
	var flag = false;
	var tmparray = wgtv.length > infv.length ? wgtv : infv;
	for(var i in tmparray) {
		if(isNaN(!!wgtv[i] ? wgtv[i] : "0") || isNaN(!!infv[i] ? infv[i] : "0")) {
			return false;
		}
		if(Number(!!wgtv[i] ? wgtv[i] : "0") > Number(!!infv[i] ? infv[i] : "0")) {
			return true;
		}
		if(Number(!!wgtv[i] ? wgtv[i] : "0") < Number(!!infv[i] ? infv[i] : "0")) {
			return false;
		}
	}
	return false;
}

function DebugMenuClicked() {
	var btnArray = [{
		title: "切换更新通道"
	}, {
		title: "切换服务器"
	}, {
		title: "自定义地址更新"
	}, {
		title: "从手机图库选择二维码更新"
	}];
	plus.nativeUI.actionSheet({
		cancel: "取消",
		buttons: btnArray
	}, function(event) {
		var index = event.index;
		switch(index) {
			case 1:
				mui.confirm('请选择更新通道', '内部功能', ['发布预览', '稳定通道'], function(e) {
					if(e.index == 0) {
						var btnArray = ['取消', '确定'];
						mui.prompt('功能启用后，您可能会随时接收到更新，该更新很可能没有经过严格的测试，会产生不可估量的后果甚至毁坏您的设备，我们不会为这些后果负责，在使用前确保您有能力处理这些意外', '请输入YES确认', '二次确认', ["取消", "确认"], function(e) {
							if(e.index == 1) {
								if(!!e.value && e.value.toLowerCase() == "yes") {
									window.localStorage.RCVersion = 1;
									mui.toast('已进入发布预览通道');
								} else {
									mui.toast('没有输入正确的确认短语，该功能没有生效');
								}
							}
						}, 'div');
					} else {
						window.localStorage.RCVersion = 0;
					}
				})
				break;
			case 2:
				plus.runtime.getProperty(plus.runtime.appid, function(inf) {
					if(inf.version == "0.0.0") {
						mui.prompt('当前:' + TLM.ServiceUrl, '请输入', '服务器地址', ['正式地址', '测试地址', '确定'], function(e) {
							if(e.index == 0) {
								TLM.ServiceUrl = TLM.ServiceUrl_distribution;
								TLM.IMServiceUrl = TLM.IMServiceUrl_distribution;
								TLM.FyxtUrl = TLM.FyxtUrl_distribution;
								openAjaxBridge(true);
							} else if(e.index == 1) {
								TLM.ServiceUrl = TLM.ServiceUrl_test;
								TLM.IMServiceUrl = TLM.IMServiceUrl_test;
								TLM.FyxtUrl = TLM.FyxtUrl_test;
								openAjaxBridge(true);
							} else if(e.index == 2) {
								TLM.ServiceUrl = e.value;
								openAjaxBridge(true);
							}
							window.localStorage.ServiceUrl = TLM.ServiceUrl;
							window.localStorage.IMServiceUrl = TLM.IMServiceUrl;
							window.localStorage.FyxtUrl = TLM.FyxtUrl;
						}, 'div');
					} else {
						mui.toast('静态页版本，该功能无效')
					}
				});

				break;
			case 3:
				mui.prompt('功能使用后，APP会立马开始更新，该更新地址由您提供，对设备与APP的影响由您自行承担', '请输入wgt地址', '地址确认', ["取消", "确认"], function(e) {
					if(e.index == 1) {
						if(!!e.value) {
							try {
								UpdateVersion(e.value);
							} catch(e) {

							}

						}
					}
				}, 'div');
				break;
			case 4:
				plus.gallery.pick(function(path) {
					plus.barcode.scan(path, QRCodeMarkSuccess, function(error) {
						mui.toast('识别失败');
					}, function(error) {
						mui.toast('failed' + error.message);
					});
				});
				break;
		}
	});
}