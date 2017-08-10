var LookupBridge = {};

TLM = function(fieldName) {
	if(this == window) {
		return new TLM(fieldName);
	}
	fieldName = fieldName.toLowerCase();
	this.field = entityField[fieldName];

	this.fieldName = fieldName;
	return this;
}

TLM.fn = TLM.prototype;

TLM.fn.SetValue = function(value) {
	try {
		switch(this.field["Type"]) {
			case "key":
				{
					return this;
				}
			case "picklist":
				{
					for(var i = entityOption[fieldName].length; i >= 0; i--) {
						if(entityOption[fieldName][i]["Value"] == value) {
							$('input[tl-for=' + this.fieldName + ']').val(entityOption[this.fieldName][i]["text"]);
							$('textarea[tl-for=' + this.fieldName + ']').val(entityOption[this.fieldName][i]["text"]);
							$('textarea[tl-for=' + this.fieldName + ']').attr('pick_value', value);
							$('input[tl-for=' + this.fieldName + ']').attr('pick_value', value);
							break;
						}
					}
					break;
				}
			case "lookup":
				{
					$('input[tl-for=' + this.fieldName + ']').val(value["name"]);
					$('input[tl-for=' + this.fieldName + ']').attr('lookup_id', value['id']);
					$('textarea[tl-for=' + this.fieldName + ']').val(value["name"]);
					$('textarea[tl-for=' + this.fieldName + ']').attr('lookup_id', value['id']);
					break;
				}
			default:
				{
					$('input[tl-for=' + this.fieldName + ']').val(value);
					$('textarea[tl-for=' + this.fieldName + ']').val(value);
				}
		}
		$('input[tl-for=' + this.fieldName + ']').trigger('change');
		$('textarea[tl-for=' + this.fieldName + ']').trigger('change');
		return this;
	} catch(e) {

	}
}

TLM.fn.GetValue = function() {
	try {
		var returnData = {};
		returnData["dataType"] = this.field["Type"];
		var inputs = $('input[tl-for=' + this.fieldName + ']');
		var textareas = $('textarea[tl-for=' + this.fieldName + ']');
		var val = inputs.length > textareas.length ? inputs : textareas;
		val = val.first();
		if(val.length == 0) {
			if(this.field["Type"]=="key") {
				if(!!obj.data){
					returnData["data"]=obj.data[this.fieldName];
				}else{
					returnData["data"]=null;
				}
				return returnData;
			}
			return null;
		}
		switch(this.field["Type"]) {
			case "key":
				{
					returnData["data"] = obj.data[this.fieldName]
					return returnData;
				}
			case "picklist":
				{
					returnData['data'] = {}

					returnData['data']['value'] = Number(val.attr('pick_value'));
										if(val.attr('pick_value').length==0) returnData['data']['value'] = null;
					for(var i = entityOption[this.fieldName].length; i >= 0; i--) {
						if(entityOption[this.fieldName][i]["Value"] == returnData['data']['value']) {
							returnData["data"]['name'] = entityOption[this.fieldName][i]['Name'];
							return returnData;
						}
					}
					returnData["data"]['name'] = null;
					return returnData;

				}
			case "lookup":
				{
					returnData['data'] = {};
					returnData['data']['id'] = val.val();
					returnData['data']['name'] = val.attr('lookup_id');
					return returnData;
				}
			default:
				{
					returnData['data'] = val.val();
					return returnData;
				}
		}
	} catch(e) {

	}
}

TLM.fn.SetDisable = function(state) {
	try {
		if(typeof(state) != 'boolean') {
			return;
		}
		$('[tl-for=' + this.fieldName + ']').attr('disabled', state);
		return this;
	} catch(e) {

	}
}

TLM.fn.SetReadonly = function(state) {
	try {
		if(typeof(state) != 'boolean') {
			return;
		}
		$('[tl-for=' + this.fieldName + ']').attr('readonly', state);
		return this;
	} catch(e) {

	}
}

TLM.fn.IsDirty=function() {
	try {

		var val = TLM.GetValue(this.fieldName);
		if(val==null) return false;
		switch(field["Type"]) {
			case "picklist":
				{
					if(obj.data[this.fieldName] != val['data']['value']) return true;
					else return false;
				}
			case "lookup":
				{
					if(obj.data[this.fieldName]==null&&val[this.fieldName]['id'].length==0) return false;
					else return true;
					if(val['data']['id'] != obj.data[this.fieldName]['id']) return true;
					else return false;
				}
			default:
				{
					if(obj.data[this.fieldName]==null&&val[this.fieldName].length==0) return false;
					else return true;
					if(val['data'] != obj.data[this.fieldName]) return true;
					else return false;
				}
		}

	} catch(e) {

	}
}

TLM.fn.SetVisible = function(state) {
	try {
		if(typeof(state) != 'boolean') {
			return;
		}
		if(state) {
			$('[tl-for=' + this.fieldName + ']').addClass('hid');
		} else {
			$('[tl-for=' + this.fieldName + ']').removeClass('hid');
		}
		return this;
	} catch(e) {

	}
}

TLM.fn.SetLookupCustomFunction=function(func){
		LookupBridge[this.fieldName] = func;
	$('div.mui-btn[tl-for=' + this.fieldName + ']').each(function() {
		this.removeEventListener("tap", lookupEvent);
	})
	mui('div.mui-btn[tl-for=' + this.fieldName + ']').off();
	mui('#content').on('tap', 'div.mui-btn[tl-for=' + this.fieldName + ']', function() {
		var lookupEntityName = this.getAttribute("lookupentity");
		var name = this.getAttribute("elementName");
		mui.openWindow({
			url: "lookup.html",
			id: "lookup_" + lookupEntityName,
			extras: {
				"view": {
					e: lookupEntityName.toLowerCase(),
					v: "LookupView".toLocaleLowerCase(),
					r: "MobilePcBirdgeCustomLookupEvent",
					elem: name
				}
			}
		});
	})
	return this;
}


//ATT
TLM.SetAttAddDisable = function(state) {
	try {
		if(typeof(state) != 'boolean') {
			return;
		}
		if(!state) {
			$('.addAttachmentButton').css('display', 'none');
		} else {
			$('.addAttachmentButton').css('display', 'block');
		}
	} catch(e) {

	}
}

TLM.SetAttEditDisable = function(state) {
	try {
		if(typeof(state) != 'boolean') {
			return;
		}
		if(!state) {
			document.getElementById('editAtta').style.display = 'none';
		} else {
			document.getElementById('editAtta').style.display = 'block';
		}
	} catch(e) {

	}
}

TLM.SetAttDeleteDisable = function(state) {
	try {
		if(typeof(state) != 'boolean') {
			return;
		}
		if(!state) {
			document.getElementById('removeAtta').style.display = 'none';
		} else {
			document.getElementById('removeAtta').style.display = 'block';
		}
	} catch(e) {

	}
}


window.addEventListener('MobilePcBirdgeCustomLookupEvent', function(event) {
	if(typeof(LookupBridge[event.detail.elem]) != 'function') {
		mui.fire(plus.webview.currentWebview(),'form_lookup',event.detail);
	} else {
		LookupBridge[event.detail.elem](event);
	}
});