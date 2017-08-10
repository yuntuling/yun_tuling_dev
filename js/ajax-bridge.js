var mui={};
mui.addEventListener=function(eventType,func)
{
	mui["fu_"+eventType]=func;
};
mui.fire=function(webview, eventType, data)
{
	if (webview) {
			if (data !== '') {
				data = data || {};
				if ($.isPlainObject(data)) {
					data = JSON.stringify(data || {}).replace(/\'/g, "\\u0027").replace(/\\/g, "\\u005c");
				}
			}
			webview.evalJS("typeof mui!=='undefined'&&mui.receive('" + eventType + "','" + data + "')");
		}
}
mui.receive = function(eventType, data)
{
	if (eventType) {
		try {
			if (data) {
				data = JSON.parse(data);
			}
		} catch (e) {}
		if(typeof mui["fu_"+eventType]=="function")
			mui["fu_"+eventType](data);
	}
};


mui.addEventListener('ajax',function(data){
	var webview=plus.webview.getWebviewById(data.webviewid);
	var funcIndex=data.funcIndex;
	
	$.ajax({
		"type":data.type,
		"url":data.url,
		"dataType":"json",
		"data":data.data,
		"success":function(resData)
		{
			if(resData&&resData.ResultCode!=undefined && resData.ResultCode != 0) 
			{
				plus.nativeUI.toast(resData.ResultMessage);
				mui.fire(webview,'ajaxSuccessOperationFailed',{"resData":resData,"funcIndex":funcIndex});
			}
			else
			{
				mui.fire(webview,'ajaxSuccess',{"resData":resData,"funcIndex":funcIndex});
			}
		},
		"error":function(xhr,textStatus,errorObj )
		{
			if(xhr.responseText.indexOf('用户登录')>0)
			{
				var wvs = plus.webview.all();
				for(var i=2;i<wvs.length;i++)
				{
					wvs[i].close();
				}
				plus.nativeUI.closeWaiting();
				plus.nativeUI.toast("请重新登录");
			}
			else
			{
				console.log(xhr.responseText);
				plus.nativeUI.toast("获取数据出错");
				mui.fire(webview,'ajaxFail',{"resData":xhr.responseText,"funcIndex":funcIndex});
			}
		},
		"complete":function(xhr, ts)
		{
			mui.fire(webview,'ajaxComplete',{"funcIndex":funcIndex});
		}
	});
});

//触发登录页面继续执行
function plusReady()
{
	mui.fire(plus.webview.currentWebview().opener(),'DoOnBridgeReady',null);
}
if(window.plus){
	plusReady();
}
else
{
	document.addEventListener("plusready",plusReady,false);
}
