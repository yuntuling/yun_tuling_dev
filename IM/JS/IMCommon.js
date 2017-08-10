$.extend({
	format: function() {
		if(arguments.length == 0)
			return null;
		var str = arguments[0];
		for(var i = 1; i < arguments.length; i++) {
			var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
			str = str.replace(re, !arguments[i] ? "" : arguments[i]);
		}
		return str;
	},
	no2ChineseNo: function(no) {
		var rst = "";
		var arrn = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
		var arrp = ['', '十'];
		var arr = no.toString().split('').reverse();
		if(arr.length == 1 || arr.length == 2) {
			for(var i = arr.length - 1; i >= 0; i--) {
				if((i == 1 && arr[i] == 1))
					rst += arrp[i];
				else if(i == 0 && arr[i] == 0)
					continue;
				else
					rst += arrn[arr[i]] + arrp[i];
			}
			return rst;
		}
		return no;
	},
	LockScreen: function() {
		var div = "<div id='_LockScreenDIV' style='position: absolute;z-index: 99999;'><img src='/_imgs/Loading.gif'></div>";
		$("body").append($(div))
		var Ptop = ($("body").height()) / 2;
		var Pleft = ($("body").width()) / 2;
		$("#_LockScreenDIV").offset({
			top: Ptop,
			left: Pleft
		});
	},
	unLockScreen: function() {
		$("#_LockScreenDIV").remove()
	},
	getQueryString: function(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
		var r = window.location.search.substr(1).match(reg);
		if(r != null) return unescape(decodeURIComponent(r[2]));
		return null;
	},
	//获取cookie
	getCookie: function() {
		var re = new Object();
		var co = document.cookie.split(";")
		for(var i = 0; i < co.length; i++) {
			var _name = co[i].split("=")[0];
			var _value = co[i].split("=")[1];
			re[_name.trim()] = _value;
		}
		return re;
	}
});

IM = new Object();
IM.storageLimit = 100;
IM.isBackGround = false;
IM.buildIMTemplete = function(templete, data) {
	var re = templete;
	for(var i in data) {
		re = re.replace(new RegExp("{{" + i + "}}", "gm"), data[i]);
	}
	return $("<div></div>").html(re).children(0);

}
IM.Server = function(method, params) {
	mui.fire(plus.webview.getWebviewById("ajaxBridge"), method, params);
}
//MSG结构体示例
IM.BuildMsg = function(to, type, content) {
	var CurrentUser = JSON.parse(localStorage.getItem("user"));
	var headimg = CurrentUser.userimg.indexOf("http") > 0 ? CurrentUser.userimg : TLM.ServiceUrl + CurrentUser.userimg;


	//构建消息结构体
	var Msg = {
		"id": new Date().getTime().toString(),
		"from": CurrentUser.username,
		"to": to,
		"datetime": "",
		//"guid": "",
		"type": type,
		"content": content,
		"username": CurrentUser.name,
		"userimg": headimg
	}
	return Msg;
}

IM.combineMsgs = function(OffLineMsgsBase) {
	//处理localMsg,变为["id":"",msgs:""]这样的模式
	var OffLineMsgs = new Array();
	for(var i = 0; i < OffLineMsgsBase.length; i++) {
		if(OffLineMsgs[OffLineMsgsBase[i].from] == null)
		{
			OffLineMsgs.push({"id":OffLineMsgsBase[i].from,"Msgs":[OffLineMsgsBase[i]]});
		}
		else{
			OffLineMsgs[OffLineMsgsBase[i].from].Msgs.splice(0,0,OffLineMsgsBase[i]);
		}
	}
	console.log(JSON.parse(OffLineMsgs));
	
};




function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes()
            + seperator2 + date.getSeconds();
    return currentdate;
}

document.addEventListener("pause",function(){
	IM.isBackGround = true;
}, false );
document.addEventListener("resume",function(){
	IM.isBackGround = false;
}, false );





///////////////////////////////////////////////////图片本地

/*<img>设置图片
 *1.从本地获取,如果本地存在,则直接设置图片
 *2.如果本地不存在则联网下载,缓存到本地,再设置图片
 * */
function setImg(imgItem, loadUrl) {

	//图片下载成功 默认保存在本地相对路径的"_downloads"文件夹里面, 如"_downloads/logo.jpg"
	var filename = loadUrl.substring(loadUrl.lastIndexOf("/") + 1, loadUrl.length);
	var relativePath = "_downloads/" + filename;
	//检查图片是否已存在
	plus.io.resolveLocalFileSystemURL(relativePath, function(entry) {
		console.log("图片存在,直接设置=" + relativePath);
		//如果文件存在,则直接设置本地图片
		setImgFromLocal(imgItem, relativePath);
	}, function(e) {
		console.log("图片不存在,联网下载=" + relativePath);
		//如果文件不存在,联网下载图片
		setImgFromNet(imgItem, loadUrl, relativePath);
	});
}


/*给图片标签<img>设置本地图片
 * imgId 图片标签<img>的id
 * relativePath 本地相对路径 例如:"_downloads/logo.jpg"
 */
function setImgFromLocal(imgItem, relativePath) {
	//本地相对路径("_downloads/logo.jpg")转成SD卡绝对路径("/storage/emulated/0/Android/data/io.dcloud.HBuilder/.HBuilder/downloads/logo.jpg");
	var sd_path = plus.io.convertLocalFileSystemURL(relativePath);
	//给<img>设置图片
	$(imgItem).attr("src", sd_path);
}

/*联网下载图片,并设置给<img>*/
function setImgFromNet(imgItem, loadUrl, relativePath) {
	//先设置下载中的默认图片
	//$(imgId).attr("src", "../images/loading.png");
	//创建下载任务
	$("button.ShowBigImgBtn").attr("disabled", "disabled");
	$("button.ShowBigImgBtn").html("下载中...");
	var dtask = plus.downloader.createDownload(loadUrl, {}, function(d, status) {
		console.log("下载地址=" + loadUrl);
		if(status == 200) {
			//下载成功
			console.log("下载成功=" + relativePath);
			setImgFromLocal(imgItem, d.filename);
			$("button.ShowBigImgBtn").hide();
		} else {
			//下载失败,需删除本地临时文件,否则下次进来时会检查到图片已存在
			console.log("下载失败=" + status + "==" + relativePath);
			$("button.ShowBigImgBtn").html("下载失败");
			//dtask.abort();//文档描述:取消下载,删除临时文件;(但经测试临时文件没有删除,故使用delFile()方法删除);
			if(relativePath != null)
				delFile(relativePath);
		}
	});
	//启动下载任务
	dtask.start();
}

/*删除指定文件*/
function delFile(relativePath) {
	plus.io.resolveLocalFileSystemURL(relativePath, function(entry) {
		entry.remove(function(entry) {
			console.log("文件删除成功==" + relativePath);
		}, function(e) {
			console.log("文件删除失败=" + relativePath);
		});
	});
}

/*判断是否是小图地址，如果是，判断大图在不在本地缓存，是，显示大图，不是，显示小图*/
function InitLoadImgSrc(currentIndex) {
	console.log("w kankan xianohushunxu")
	$.each($(".mui-slider-group .mui-slider-item img"), function(i, v) {
		var loadUrl = $(v).attr("src");
		var filename = loadUrl.substring(loadUrl.lastIndexOf("/") + 1, loadUrl.length);

		if(filename.indexOf("_small.jpg") > -1) {
			var BigImgSrc = filename.replace("_small.jpg", ".jpg");
			var relativePath = "_downloads/" + BigImgSrc;
			//检查图片是否已存在
			plus.io.resolveLocalFileSystemURL(relativePath, function(entry) {
				console.log("图片存在,直接设置大图=" + relativePath);
				//如果文件存在,则直接设置本地图片
				setImgFromLocal($(v), relativePath);
				if(i == currentIndex) {
					document.getElementById("ShowBigImgBtn").style.display = "none";
				}
			}, function(e) {

			});
		}

	})

}

/**
 * 图片懒加载
 * @param {Object}   obj       DOMElement
 * @param {Function} callback  加载完成回调函数
 * 
 * @author fanrong33
 * @version 1.1.0 build 20160107
 */
function lazyloadImg(obj, callback) {

	if($(obj).attr('data-loaded')) {
		return;
	}

	var image_url = $(obj).attr('data-lazyload');

	// 1. 转换网络图片地址为本地缓存图片路径，判断该图片是否存在本地缓存
	var filename = image_url.substring(image_url.lastIndexOf("/") + 1, image_url.length);

	var relative_image_path = "_downloads/" + filename; // 缓存本地图片url
	var absolute_image_path = plus.io.convertLocalFileSystemURL(relative_image_path);

	//检查图片是否已存在
	plus.io.resolveLocalFileSystemURL(relative_image_path, function(entry) {
		console.log("已经存在小图" + relative_image_path);
		// 1.1 存在，则直接显示（本地已缓存，不需要淡入动画）
		$(obj).attr('src', absolute_image_path);
		$(obj).attr('data-loaded', true);
		$(obj).addClass('img-lazyload');

		callback && callback();
		return;
	}, function(e) {

		// 1.2 下载图片缓存到本地

		function download_img() {
			var download_task = plus.downloader.createDownload(image_url, {
				filename: relative_image_path // filename:下载任务在本地保存的文件路径
			}, function(download, status) {
				if(status != 200) {
					// 下载失败,删除本地临时文件

					if(relative_image_path != null) {
						plus.io.resolveLocalFileSystemURL(relative_image_path, function(entry) {
							entry.remove(function(entry) {

								// 重新下载图片
								download_img();
							}, function(e) {

							});
						});
					}
				} else {
					console.log("下载小图" + relative_image_path);
					// 把下载成功的图片显示
					// 将本地URL路径转换成平台绝对路径
					$(obj).attr('src', plus.io.convertLocalFileSystemURL(relative_image_path));
					$(obj).attr('data-loaded', true);
					$(obj).addClass('img-lazyload');

					callback && callback();
				}
			});
			download_task.start();
		}
		download_img();
	});

}