//处理附件 zhuxj 2016-08-02

//拍照上传
function opencamera() {
	var cmr = plus.camera.getCamera(1);
	cmr.captureImage(
		function(path) {
			//上传
			var wa = plus.nativeUI.showWaiting();
			var task = plus.uploader.createUpload(
				TLM.ServiceUrl + "/Service/Attachment/AddAttachment.ashx", {
					method: "POST",
					blocksize: 0
				},
				function(t, status) {
					if(status == 200) {
						var ret = JSON.parse(t.responseText);
						if(ret.ErrorMessage) {
							wa.close();
							alert(ret.ErrorMessage);
						} else {
							wa.close();
							document.getElementById("att_image_add").src = TLM.ServiceUrl + ret.Result + "?r=" + Date.now().toString()
							document.getElementById("att_image_add").realsrc = ret.Result;
							$("#AddAttachment").show();
							$("#att_name_add").val("");
							$("#att_desc_add").val("");
						}
					} else {
						wa.close();
						alert("Upload failed ");
					}
				}
			);
			task.addFile(path, {
				key: "userimg"
			});
			task.start();
		}
	);
}

//本地上传
function galleryImg(element) {
	plus.gallery.pick(
		function(path) {
			var wa = plus.nativeUI.showWaiting();
			var task = plus.uploader.createUpload(
				TLM.ServiceUrl + "/Service/Attachment/AddAttachment.ashx", {
					method: "POST",
					blocksize: 0
				},
				function(t, status) {
					if(status == 200) {
						var ret = JSON.parse(t.responseText);
						if(ret.ErrorMessage) {
							wa.close();
							alert(ret.ErrorMessage);
						} else {
							wa.close();
							//var img = element.querySelector("img");
							document.getElementById("att_image_add").src = TLM.ServiceUrl + ret.Result + "?r=" + Date.now().toString();
							document.getElementById("att_image_add").realsrc = ret.Result;
							$("#AddAttachment").show();
							$("#att_name_add").val("");
							$("#att_desc_add").val("");
						}
					} else {
						wa.close();
						alert("Upload failed: ");
					}
				}
			);
			task.addFile(path, {
				key: "userimg"
			});
			task.start();
		},
		function(e) {}, {
			filter: "image"
		}
	);
}

function ImageView() {
	mui('#AttachmentButtonList').popover('hide', currentAttachment);
	mui.trigger($(currentAttachment).find("img")[0], 'tap');
}

function DelAttachment() {
	var templete = $(currentAttachment);
	var attachmentid = templete.find("[attoname=attachmentid]").val()
	TLM.ajax({
		type: "post",
		url: TLM.ServiceUrl + "/Service/Data/SoftDeleteItem.ashx",
		data: {
			entityname: "attachment",
			id: attachmentid
		},
		success: function(data, textStatus) {
			templete.remove();
			mui.toast("删除成功! ");
		}
	});
}

function EditAttachment() {
	var templete = $(currentAttachment)
	$("#att_attflag_add").val(templete.find("[attoname=attflag]").val());
	$("#att_AttrachmentId_add").val(templete.find("[attoname=attachmentid]").val());
	$("#att_image_add").attr("src", templete.find("[attoname=attpath]").attr("src"));
	$("#att_name_add").val(templete.find("[attoname=name]").text());
	$("#att_desc_add").val(templete.find("[attoname=attdesc]").text());

	$("#AddAttachment").show();
	mui('#AttachmentButtonList').popover('hide', currentAttachment);
}


function checkAttachment(){ return true }

function SaveAttachmentRecord() {
	var check = checkAttachment();
	if(check != null && check == false)
		return;
	
	
	
	var entityData = {};
	entityData.attachmentid = document.getElementById("att_AttrachmentId_add").value;
	entityData.name = document.getElementById("att_name_add").value;
	entityData.attdesc = document.getElementById("att_desc_add").value;
	entityData.attpath = document.getElementById("att_image_add").realsrc;
	entityData.attflag = document.getElementById("att_attflag_add").value;
	entityData.attribute1 = null;
	entityData.attribute2 = null;
	entityData.attribute3 = null;
	entityData.recordid = id;
	entityData.entityname = entityName;

	var json = JSON.stringify(entityData);
	console.log(json);

	

	mui.ajax({
		type: "post",
		url: TLM.ServiceUrl + "/Service/Data/SaveFormData.ashx",
		data: {
			entityname: "attachment",
			data: json,
			id: entityData.attachmentid
		},
		success: function(data, textStatus) {
			if(entityData.attachmentid == "")
			{
				var templeteContent = $("[name=attachment][attflag=" + $("#att_attflag_add").val() + "]");
				var templete = null;
				var flag = 0
				$("[attoname=attachmentid]").each(function() {
					var t = $(this);
					if(t.val() == data.ResultData) {
						templete = t.parent();
					}
				})
				if(templete == null) {
					templete = $(templeteContent.children("[ismodel=true]")[0]).clone();
					flag = 1;
				}
				templete.attr("ismodel", "false");
				templete.find("[attoname=entityname]").val(entityName);
				templete.find("[attoname=attflag]").val($("#att_attflag_add").val());
				templete.find("[attoname=recordid]").val(id);
				templete.find("[attoname=attachmentid]").val(data);
				templete.find("[attoname=attpath]").attr("src", $("#att_image_add").attr("src"));
				if(templete.find("[attoname=attpath]").is("img")) {
					templete.find("[attoname=attpath]").attr("data-preview-group", $("#att_attflag_add").val());
					templete.find("[attoname=attpath]").attr("data-preview-src", "");
				}
				templete.find("[attoname=name]").text($("#att_name_add").val());
				templete.find("[attoname=attdesc]").html($("#att_desc_add").val());
				if(flag == 1) {
					templeteContent.find(".addAttachmentButton").before(templete);
				}
				templete.show();
				//}
			}
			else
			{
				var templete1 = $(currentAttachment)
				
				templete1.find("[attoname=attpath]").attr("src",document.getElementById("att_image_add").src);
				templete1.find("[attoname=name]").text(document.getElementById("att_name_add").value);
				templete1.find("[attoname=attdesc]").text(document.getElementById("att_desc_add").value);
			}
			mui.toast("图片上传成功! ");
			$("#AddAttachment").hide();
		},
		error: function(data) {
			for(var i in data) {
				console.log(i + ":" + data[i]);
			}

			mui.toast("保存失败!");
		}
	});
}

function AttachmentManagement(attachmentsText) {
	var attachments = attachmentsText
	if(attachments != null) {
		for(var i = 0; i < attachments.length; i++) {
			var templeteContent = $("[name=attachment][attflag=" + attachments[i].AttFlag + "]");
			if(templeteContent.children().length > 0) {
				//						templeteContent.html(templeteContent.html().replace(/>\s*</g, '><').replace(/(^\s*)|(\s*$)/g, ""));
				//						var temphtml = $(templeteContent.children("[ismodel=true]")[0]).prop('outerHTML').replace(/>\s*</g, '><').replace(/(^\s*)|(\s*$)/g, "");
				//						var templete = $(temphtml).attr("ismodel", "false");
				var templete = $(templeteContent.children("[ismodel=true]")[0]).clone();
				templete.attr("ismodel", "false");
				templete.find("[attoname=entityname]").val(attachments[i].EntityName);
				templete.find("[attoname=attflag]").val(attachments[i].AttFlag);
				templete.find("[attoname=recordid]").val(attachments[i].RecordId);
				templete.find("[attoname=attachmentid]").val(attachments[i].AttachmentId);
				templete.find("[attoname=attpath]").attr("src", TLM.ServiceUrl + attachments[i].AttPath);
				if(templete.find("[attoname=attpath]").is("img")) {
					templete.find("[attoname=attpath]").attr("data-preview-group", attachments[i].AttFlag);
					templete.find("[attoname=attpath]").attr("data-preview-src", "");
				}
				templete.find("[attoname=name]").text(attachments[i].Name);
				templete.find("[attoname=attdesc]").html(attachments[i].AttDesc);
				templete.find("[attoname=attribute1]").html(attachments[i].Attribute1);
				templete.find("[attoname=attribute2]").html(attachments[i].Attribute2);
				templete.find("[attoname=attribute3]").html(attachments[i].Attribute3);
				templeteContent.append(templete);
			}
		}
	}

	$("[ismodel=true]").hide();
	$("[name=attachment]").append($("<div class='addAttachmentButton' style='text-align: center;padding:10px' ><a style='margin: 20px;line-height: 18px;height：800px; display：bolck' class='addAttachment' href='#AddAttachment'><span class='mui-icon mui-icon-plus'></span>添加</a></div>"))
}

var currentAttachment = null;
mui("body").on('tap', '[ismodel=false]', function(e) {
	mui('#AttachmentButtonList').popover('toggle', this);
	currentAttachment = this;
});

mui("body").on('tap', '.addAttachment', function(e) {
	//$("#addAttachment").show();
	$("#att_attflag_add").val($(this).parent().parent().attr("attflag"));
	mui.trigger(document.getElementById('att_image_add'), "tap");
});



//上传绑定
document.getElementById('att_image_add').addEventListener('tap', function() {
	var btnArray = [{
		title: "拍照"
	}, {
		title: "从手机相册选择"
	}];
	plus.nativeUI.actionSheet({
		cancel: "取消",
		buttons: btnArray
	}, function(event) {
		var index = event.index;
		switch(index) {
			case 1:
				opencamera();
				break;
			case 2:
				galleryImg();
				break;
		}
	});
});

mui.previewImage();