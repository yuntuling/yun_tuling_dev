Date.prototype.format = function (format)   //格式化日期时间
{
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "H+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(format))
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}

try{
	if(!TLM){
	TLM={};
	}
}catch(e){
	TLM={};
}
TLM.funcIndex=0;
TLM.successFuncs={};
TLM.completeFuncs={};
TLM.failFuncs={};
//接口地址
TLM.ServiceUrl_distribution = "http://test-yun-tuling.chinacloudsites.cn";

//费用系统地址
TLM.FyxtUrl_distribution = "http://yun.tulingbuy.com:7020";
//商城地址
TLM.MallServiceUrl = "http://www.tulingbuy.com";
//商城图片地址
TLM.MallImgUrl = "http://img.tulingbuy.com";

TLM.ServiceUrl_test = "http://test-yun-tuling.chinacloudsites.cn";
TLM.FyxtUrl_test="http://192.168.33.177:8082";


if(window.localStorage.ServiceUrl != undefined)
{
	TLM.ServiceUrl=window.localStorage.ServiceUrl;
	TLM.FyxtUrl=window.localStorage.FyxtUrl;
}
else
{
	TLM.ServiceUrl = TLM.ServiceUrl_distribution;
	TLM.FyxtUrl = TLM.FyxtUrl_distribution;
}

TLM.OpenWindow=function(views)
{
	if(localStorage.appversion!="0.0.0" && views[0].url.indexOf("form.html")>=0)
	{
		views[0].url="/form/"+views[0].e + "_"+(!!views[0].form? views[0].form.toLowerCase():"appdefaultform")+".html";
	}
	if(!views[0].id || views[0].id=="")
	{
		views[0].id=views[0].url;
	}
	mui.openWindow({
            'url': views[0].url,
            'id': views[0].id+(plus.webview.getWebviewById(views[0].id)==null?((new Date())*1).toString():""),
            'extras':{'views':views},
            'show': {
                aniShow:'pop-in'//参考官方的效果
            },
            'waiting':{autoShow:false}
       });
}


TLM.ajax=function (opt) 
{	
	if((typeof opt.success)!='function')
	{
		opt.success=function(d){};
	}
	TLM.funcIndex=TLM.funcIndex+1;
	TLM.successFuncs["f"+TLM.funcIndex.toString()]=opt.success;
	TLM.completeFuncs["f"+TLM.funcIndex.toString()]=opt.complete;	
	TLM.failFuncs["f"+TLM.funcIndex.toString()]=opt.error;
	mui.fire(plus.webview.getWebviewById("ajaxBridge"),'ajax',
	{
		"type":opt.type,
		"url":opt.url,
		"dataType":opt.dataType,
		"data":opt.data,
		"webviewid":plus.webview.currentWebview().id,
		"funcIndex":TLM.funcIndex
	});
};
window.addEventListener('ajaxSuccess',function(event){

	var resData=event.detail.resData;
	var funcIndex=event.detail.funcIndex;
	if(typeof TLM.successFuncs["f"+funcIndex.toString()]=="function")
		TLM.successFuncs["f"+funcIndex.toString()](resData);
});

window.addEventListener('ajaxSuccessOperationFailed',function(event){

	var resData=event.detail.resData;
	var funcIndex=event.detail.funcIndex;
	if(typeof TLM.successFuncs["f"+funcIndex.toString()]=="function")
		TLM.successFuncs["f"+funcIndex.toString()](resData);
});

window.addEventListener('ajaxFail',function(event){

	var resData=event.detail.resData;
	var funcIndex=event.detail.funcIndex;
	if(typeof TLM.failFuncs["f"+funcIndex.toString()]=="function")
		TLM.failFuncs["f"+funcIndex.toString()](resData);
});

window.addEventListener('ajaxComplete',function(event){
	var funcIndex=event.detail.funcIndex;
	if(typeof TLM.completeFuncs["f"+funcIndex.toString()]=="function")
		TLM.completeFuncs["f"+funcIndex.toString()]();
	delete TLM.successFuncs["f"+funcIndex.toString()];
	delete TLM.completeFuncs["f"+funcIndex.toString()];
});

function DateToStr(d0){
	var d= new Date(Date.parse(d0.replace(/-/g, "/")));  
	return (d.getFullYear()+"-"+ultZeroize(d.getMonth()+1)+"-"+ultZeroize(d.getDate()));
}
function ultZeroize(v){
	var z="";	
	if(v<10)
	  z="0";
	return z+v;
};

 //获得头像,如果没有头像则返回默认头像
var getAvatar = function (headImage){
	var result;
	if (headImage && headImage.match("http")){
		result = headImage;			
	}
	else{
		result = TLM.ServiceUrl + headImage;
	}
	return result;
}
function NewOpenWindow(id)
{
	mui.openWindow({
            url: id,
            id: id,
            show: {
                aniShow:'pop-in',//参考官方的效果
            }
       });
}

function OpenView(id,extras)
{
//	参数说明
//	extras:
//	{
//		entity_en:"实体英文名",
//		entity_cn:"实体中文名",
//		viewName:"视图名称",
//		icon:"图标"{JSON，包括color、type两个字段，颜色与类别},
//		showFields:[列表显示的字段],
//		orderField:"排序字段",
//		orderType:"排序方式（asc,desc）",
//		searchFields:[可搜索的字段]
//      ReferPage:转向页面地址
//	}
	mui.openWindow({
	    url:'/StandardPages/pullrefresh_main.html',
	    id:id,	    
	    extras:extras, //自定义扩展参数，可以用来处理页面间传值
	    show:{aniShow:'pop-in'}
	});
}

(function(){
	var utils = utils || {};
	/**
	 * 获得头像
	 */
	utils.getAvatar = function (headImage){
		var result;
		if (headImage && headImage.match("http")){
			result = headImage;			
		}
		else{
			result = TLM.ServiceUrl + headImage;
		}
		return result;
	}
	
	/*
	 * 设置icon上的数字，只在ios上有效
	 */
	utils.setBadge = function (num) {
		var num = num || 1;
		plus.runtime.setBadgeNumber(num);
	};

	/**
	 * 清除icon上的数字，只在ios上有效
	 */
	utils.clearBadge = function () {
		plus.runtime.setBadgeNumber(0);
	};
	
	/**
	 * utf16解码
	 * @param str
	 * @returns {void|XML|*|string}
	 */
	utils.utf16ToEntities = function (str) {
		if(!!str==false) return "";
		var patt=/[\ud800-\udbff][\udc00-\udfff]/g;
		// 检测utf16字符正则
		str = str.replace(patt, function(char){
			var H, L, code;
			if (char.length===2) {
				H = char.charCodeAt(0);
				// 取出高位
				L = char.charCodeAt(1);
				// 取出低位
				code = (H - 0xD800) * 0x400 + 0x10000 + L - 0xDC00;
				// 转换算法
				return "&#" + code + ";";
			} else {
				return char;
			}
		});
		return str;
	};

	/**
	 * 将字符串转换成utf16编码
	 * @param str
	 * @returns {void|XML|*|string}
	 */
	utils.entitiesToUtf16 = function(str){
		// 检测出形如&#12345;形式的字符串
		var strObj = utils.utf16ToEntities(str);
		var patt = /&#\d+;/g;
		var H,L,code;
		var arr = strObj.match(patt)||[];
		for (var i=0;i<arr.length;i++){
			code = arr[i];
			code=code.replace('&#','').replace(';','');
			// 高位
			H = Math.floor((code-0x10000) / 0x400)+0xD800;
			// 低位
			L = (code - 0x10000) % 0x400 + 0xDC00;
			code = "&#"+code+";";
			var s = String.fromCharCode(H,L);
			strObj.replace(code,s);
		}
		return strObj;
	};
	/**
	 * 获得本地的会话列表
	 */
	utils.getChatList = function() {	
		var empno = localStorage.getItem("empno");
		var chatList = localStorage.getItem("chatList_" + empno);
		if (!chatList) {
			chatList = null;
		}
		else {
			chatList= JSON.parse(chatList);
		}
		return chatList;
	}
	/**
	 * 修改本地会话的flag
	 */
	utils.updateChatList = function(data){
		var empno = localStorage.getItem("empno");
		var chatList = JSON.parse(localStorage.getItem("chatList_" + empno));
		var toUser = JSON.parse(localStorage.getItem("toUser")).userName;
		if(!!chatList[toUser]==false || data.hasOwnProperty(toUser) == false){
			return;
		}
		if(data.toUser == empno){
			chatList[toUser].flag = false;
		}
		localStorage.setItem("chatList_" + empno, JSON.stringify(chatList));
	}
	
	/**
	 * 设置本地的会话列表
	 */
	utils.setChatList = function(chatList) {
		var empno = localStorage.getItem("empno");
		localStorage.setItem("chatList_" + empno, JSON.stringify(chatList));
	}
	
	utils.updateChatListName = function(msgsessionid,name){
		var empno = localStorage.getItem("empno");
		var chatList = JSON.parse(localStorage.getItem("chatList_" + empno));
		for(var key in chatList){
			if(key==msgsessionid){
				chatList[key].name = name;
			}
		}
		localStorage.setItem("chatList_" + empno, JSON.stringify(chatList));
	}
	
	/**
	 * 设置查询时间
	 * @param {userName} 工号
	 * @param {queryTime} 查询时间
	 */
	utils.setQueryTime = function(empno, queryTime){
		localStorage.setItem("queryTime_" + empno, queryTime);
	}
	
	/**
	 * 读取查询时间
	 * @param {Object} userName 登录名
	 */
	utils.getQueryTime = function(empno){
		return localStorage.hasOwnProperty("queryTime_" + empno) ? localStorage.getItem("queryTime_" + empno) : "2017/01/01 01:00:00";		
	}
	
	/**
	 * object排序
	 * @param {Object} obj
	 * @param {Object} sortKey 排序关键字
	 */
	utils.sort = function(obj, sortKey, objKey) {
		var result = [];
	    var array = [];
	    var sortKey =  sortKey || "addTime";
	    var objKey = objKey || "userName";
	    for (var key in obj) {
	        array.push(obj[key]);
	    }
	    array.sort(function (a, b) {
	    	if (!a || !b) return 0;
	    	var x = a[sortKey]; 
	    	var y = b[sortKey];
	        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
	    });
		for (key in array){
			if (array[key][objKey] !== null){
				result.push(array[key][objKey]);
			}
		}
		return result;
	}
	window.utils = utils;
	return utils;
})()	