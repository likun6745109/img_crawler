var express = require('express')
var router = express.Router()
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var request = require('request')
var cheerio = require('cheerio')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var async = require('async')



router.get('/', function(req, res, next) {
	res.render('index');
});

//千图网——————————————————————————————————————————————————————————————————————————————————
var imagesurl =[]
var maximagesurl=[]
router.post('/qiantu/crawler',multipartMiddleware,function(req,res){
	var url = req.body.qtweburl
	console.log(url)
	request(url,function(error,response,body){
		if(!error && response.statusCode == 200)
		{
			maximagesurl=[]
			imagesurl =[]
			var $ = cheerio.load(body)	
			var result = []
			//var find = $("#auto_list1 #listBox .flow-box .flow-thumb .thumb-box ")
			var find = $("img")
			//var result = find.length
			console.log(find.length)
			for(var i=0;i<find.length;i++)
			{
				if($(find[i]).hasClass('searchLoad') || $(find[i]).hasClass('scrollLoading'))
				{
					var img_url = $(find[i]).attr("data-url")
				}else{
					if($(find[i]).hasClass('lazyload'))
					{
						var img_url = $(find[i]).attr("data-original")
						if(typeof(img_url) == 'undefined')
						{
							var img_url = $(find[i]).attr("src1")
						}
					}else{
						var img_url = $(find[i]).attr("src")
					}
				}
				console.log(img_url)
				if(img_url.indexOf("pic.qiantucdn.com/58pic")!= -1 || img_url.indexOf("!qt")!= -1 )
				{
					var img_realurl = img_url.split('!')[0]
					var maximg_realurl = img_realurl.replace(/.jpg/i,"_1024.jpg")
					imagesurl.push(img_realurl)
					maximagesurl.push(maximg_realurl)
					result.push(img_realurl)
				}
			}
			res.render('qianturesult',{
				"result":result
			})
		}
	})
})

router.get('/download/qiantu',function(req,res){
	var dir = 'd:/downloadimages'
	mkdirp(dir,function(err){//创建存储目录
		if(err)
		{
			console.log(err)
		}
	})
	async.mapSeries(imagesurl,function(item, callback){//异步下载
    	setTimeout(function(){
        	downloadPic(item, dir+'/'+ (new Date()).getTime() +'.jpg');
       		callback(null, item);
    	},400);
	}, function(err, results){
		imagesurl =[] //下载完成后清空
		res.render('index')
	});
})
router.get('/download/qiantu/max',function(req,res){//下载大图
	var dir = 'd:/downloadimages'
	mkdirp(dir,function(err){//创建存储目录
		if(err)
		{
			console.log(err)
		}
	})
	async.mapSeries(maximagesurl,function(item, callback){//异步下载
    	setTimeout(function(){
        	downloadPic(item, dir+'/'+ (new Date()).getTime() +'.jpg');
       		callback(null, item);
    	},400);
	}, function(err, results){
		maximagesurl =[] //下载完成后清空
		res.render('index')
	});
})

///素材中国————————————————————————————————————————————————————————————————————
var sczg_imgurl=[]
var sczg_imgparent_href=[]

router.post('/sczg/crawler',multipartMiddleware,function(req,res){
	var url = req.body.sczgweburl
	console.log(url)
	if(url.indexOf("/cion/")!=-1)
	{
		request(url,function(error,response,body){
		if(!error && response.statusCode == 200)
		{
			sczg_imgurl =[]
			var $ = cheerio.load(body) 
			//body table tbody tr td table tbody tr td table tbody tr td table tbody tr td div a 
			var findimg = $("img")
			for(var i=0;i<findimg.length;i++)
			{
				var imgurl =$(findimg[i]).attr("src")
				var web = imgurl.replace("../../..","http://online.sccnn.com")
				console.log(web)
				if(imgurl.indexOf("/img2")!= -1)
				{

					sczg_imgurl.push(web)
				}
			}
			res.render('sczgicon',{
				"img_result":sczg_imgurl
			})
			
		}
		})
	}else{
	request(url,function(error,response,body){
		if(!error && response.statusCode == 200)
		{
			sczg_imgurl =[]
			sczg_imgparent_href=[]
			var $ = cheerio.load(body) 
			//body table tbody tr td table tbody tr td table tbody tr td table tbody tr td div a 
			var findimg = $("img")
			for(var i=0;i<findimg.length;i++)
			{
				var imgurl = $(findimg[i]).attr("src")
				if(imgurl.indexOf("img.sccnn.com")!= -1)
				{
					var maximgurl = imgurl.replace(/simg/i,"bimg")
					sczg_imgurl.push(maximgurl)
					var parent = $(findimg[i]).parent()
					var parent_href ='http://www.sccnn.com'+$(parent).attr("href")
					sczg_imgparent_href.push(parent_href)
				}
			}
			res.render('sczgresult',{
				"img_result":sczg_imgurl
			})
			
		}
	})
	}
})

router.get('/download/sczg',function(req,res){
	var dir = 'd:/downloadimages'
	mkdirp(dir,function(err){//创建存储目录
		if(err)
		{
			console.log(err)
		}
	})
	async.mapSeries(sczg_imgurl,function(item, callback){//异步下载
		//
    	setTimeout(function(){
    		var gs = item.substr(item.length-4)
        	downloadPic(item, dir+'/'+ (new Date()).getTime() +gs);
       		callback(null, item);
    	},400);
	}, function(err, results){
		sczg_imgurl =[] //下载完成后清空
		res.render('index')
	});
})

router.get('/download/sczgpsd/:i',function(req,res){
	var i = parseInt(req.params.i)
	var url = sczg_imgparent_href[i]
	console.log(url)
	request(url,function(error,response,body){
		if(!error && response.statusCode ==200)
		{
			var $2= cheerio.load(body)
			var findpsd = $2(".down").find("a").eq(1)
			var psdurl = $2(findpsd).attr("href")
			res.render('downpsd',{
				"psdurl":psdurl
			})
		}
	})
})

module.exports = router

var downloadPic = function(src, dest){
    request(src).pipe(fs.createWriteStream(dest)).on('close',function(){
        console.log('pic saved!')
    })
}