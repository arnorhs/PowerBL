


$(document).ready(function () {

	mbl_urls.start_retrieval();
	
	/* bæta við events fyrir að skoða spjall þráð osfrv */
	$('a.powerbl-comments').live('click',function () {
		
		var $comment_div = $(this).next();
		
		if ($comment_div.html().length > 0) {
			$comment_div.html('').removeClass('active');
		} else {
			// passa að allir séu lokaðir
			$('div.powerbl-comments').html('').removeClass('active');
			$comment_div.append(powerbl.disqus_code($comment_div.attr('uid'))).addClass('active');
		}
	});
	
	// ef notandinn scrollar, loada viðkomandi contenti
	$(window).scroll(function(){
		if (mbl_requests.finished()) {
			powerbl.check_boundary();
		}
	});

});


var mbl_urls = {

	start_retrieval: function () {

		for (var i in mbl_urls.urls) {
			with (mbl_urls.urls[i]) {
				if (active) {
					mbl_requests.ajax_request(url);
				}
			}
		}	
		
	},
	
 


	urls: [
		{
			title: 'Innlent',
			url: 'http://mbl.is/mm/frettir/innlent/',
			active: 1
		},
		{
			title: 'Innlent',
			url: 'http://mbl.is/mm/frettir/erlent/',
			active: 1
		},
		{
			title: 'Innlent',
			url: 'http://mbl.is/mm/frettir/togt/',
			active: 1
		},
		{
			title: 'Innlent',
			url: 'http://mbl.is/mm/vidskipti/frettir.html',
			active: 1
		}
	]

};


var powerbl = {

	/* format á listi breytu: {
		url:
		titill:
		texti:
		timestamp:
		dags:
		timi:	
		img:
	} */
	listi: [],
	
	
	
	add: function (item) {
		powerbl.listi.push(item);
	},
	render_single: function (item) {
		return 	'<li uid="'+item.url+'">'+
					(item.img ? '<img src="'+item.img+'" alt="mynd með frétt" />' : '') +
					'<h4><a href="'+item.url+'">'+item.titill+'</a></h4>'+
					'<p class="intro">'+item.texti+'</p>'+
					'<div class="fulltext"></div>' +
					'<div class="misc"><a class="powerbl-comments">Comments</a><div uid="'+item.url+'" class="powerbl-comments"></div></div>'+
				'</li>';
	},
	disqus_code: function (uid) {
		return '<div id="disqus_thread"></div>' +
				'<script type="text/javascript">' +
				'var disqus_identifier = "'+uid+'";' +
				'var disqus_developer = 1;'+
				'(function() {' +
				"var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;" +
				"dsq.src = 'http://powerbl.disqus.com/embed.js';" +
				"(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);" +
				'})();'+
				'</script>';
	},
	render: function () {

		// byrjum á að raða í rétta röð
		powerbl.listi.sort(function(a,b){
			return b.timestamp.localeCompare(a.timestamp);
		})
		
		// hreinsa contentið sem var fyrir
		var $c = $('#powerbl-content').html('');
		
		for (var uid in powerbl.listi) {
			$c.append('<ul>'+powerbl.render_single(powerbl.listi[uid])+'</ul>');
		}

	},
	
	stop_load: function () {
		$('div.indicator').html('');
	},
	start_load: function () {
		$('div.indicator').html('<span class="loading"></span>');
	},
	/*
		Fer í gegnum alla elements (allar fréttir) og finnur út hvort þær
		séu staðsettar innan gluggans - ef svo er, þá skilar hann þeim 
	*/
	uids_within_window: function(){
		var uids = [];
		var range = {top: $(window).scrollTop(), bottom: $(window).scrollTop() + $(window).height() };
		// ættum kannski að bæta smá við, svo það verði ekki svo mikið delay þegar notandinn skrollar
		// hefðum kannski aldrei þurft window height.. ???
		// síðan stækkar glugginn líka geðveikt mikið þegar textinn bætist við..  hmmm
		range.bottom = range.bottom + 500;

		$('#powerbl-content ul li').each(function(){
			// þurfum bara að athuga efri línuna
			var p = $(this).position().top;
			if (p >= range.top && p <= range.bottom ) {
				uids.push($(this).attr('uid'));
			}
		});
		
		return uids;
	},
	check_boundary: function () {
	
		// skilar array af uids
		var uids = powerbl.uids_within_window();
		
		for (var i in uids) {
			powerbl.load_single_content(uids[i]);
		}

	},
	
	// býr til ajax kall sem sækir allan texta við einhverja mbl grein
	load_single_content: function (uid) {
	
		// athugum fyrst hvort það var búið að því
		if ($("li[uid='"+uid+"'] div.fulltext").html().length > 0) {

			return;
		}
		
		$("li[uid='"+uid+"'] div.fulltext").html('<div class="loading"></div>');
		
		//pff.. þetta uid er í raun bara url - gæti alltaf breyst ef við bætum við Vísir.is eða eitthvað
		$.ajax({
			url: uid,
			type: 'GET',
			dataType: 'text',
			success: powerbl.insert_single_content			
		});
	},
	
	insert_single_content: function (text) {
	
	
		// byrjum á að skipta út textanum....
		
		var content = '';
	
		$(text).find('p.maintext').each(function(){
			content = content + '<p>'+$(this).html()+'</p>';
		});
		
		// myndin
		var imgsrc = $(text).find('div.newsimg-left img:not(.magnify)').attr('src');
	
	
		var $element = $("li[uid='"+this.url+"']");
		$element.find('div.fulltext').html(content);
		$element.find('p.intro').remove();
		
		// síðan skiptum við út myndinni
		if (imgsrc) {
			$element.find('img').attr('src','http://mbl.is' + imgsrc);
		}
		

	}
	
};




var mbl_requests = {

	nor: 0, // number of requets
	
	finished: function () {
		return (mbl_requests.nor == 0);
	},

	parse_page: function (html, textStatus, XMLHttpRequest) {

		html = $(html).find('#main-content').html();
		var count = 0;
		// virkaði einhverra hluta vegna ekki að nota .find()		
		$(html).filter('div').filter('.newslist-item, #toppfrett').each(function () {
		
			if (typeof ($(this).find('h4 a').attr('href')) != 'undefined') { // sjáum hvort linkur sé á réttum stað í element
				// þá ættum við að vera good to go
				mbl_requests.parse_item(this);
				
				//console.log(linkur.match(/\/\d{4}\/\d{2}\/\d{2}\//)[0] );
				count++;
			}
		});
		
		mbl_requests.nor--;

		// renderum í hvert skipti sem það kemur eitthvað nýtt
		powerbl.render();
		
		// athugum hvort þetta var síðasti - þá skulum við hætta að loada
		if (mbl_requests.nor < 1) {
			powerbl.stop_load();
			powerbl.check_boundary();
		}
		
	},
	
	fetch_full_text: function (url) {
		
	},
	
	parse_item: function (div) {
		var $div = $(div);
		
		// undirflokkur, aðalflokkur, dags, tími
		var misc = $div.find('.tiny.gray').text();
		
		var url = $div.find('h4 a').attr('href');
		
		var texti = mbl_requests.parse_texti($div.find('p.smallish').html());
		
		var new_item = {
			"url": 'http://mbl.is'+url,
			"titill": $div.find('h4').text(),
			"timestamp": mbl_requests.parse_timestamp(url, misc), // þurfum líka urlilð - aðeins þægilegra af því það vantar ár í dags.
			"texti": texti, // tökum htmlið því það gætu verið external linkar sem við viljum halda
			"img": ($div.find('img').length > 0) ? 'http://mbl.is'+$div.find('img').attr('src') : ''
		}	
		
		powerbl.add(new_item)
		
	},
	
	parse_texti: function (txt) {
	
		if (!txt) return '';
	
		var $txt = $('<div>'+txt+'</div>');
		// Þurfum að loopa í gegnum linka og skipta út urlinu, ef það vantar http
		$txt.find('a').each(function() {

			$(this).attr('href', ($(this).attr('href').search("http://") == -1) ? 'http://mbl.is'+$(this).attr('href') : $(this).attr('href'))
		});
		return $txt.html();
	
	},
	
	/*
		Þessi function mun vonandi skila tíma í þessu formi: YYYYMMDDHHMM
	*/
	parse_timestamp: function (url, str) {
	
		var dags = url.match(/\d{4}\/\d{2}\/\d{2}/)[0].split('/');
	
		var timi = str.split('|')[3].split(':'); // ætti að skila array með gildunum kls + mínútur
		for (var i in timi) {
			timi[i] = timi[i].replace(/^\s+|\s+$/g,"");
			// ef hann er bara 1 tölustafur
			timi[i] = (timi[i].length < 2 ) ? '0'+timi[i] : timi[i];

		}
		return dags.join('')+timi.join('');
		
		
	},
	

	ajax_request: function (url) {
	
		powerbl.start_load();
	
		mbl_requests.nor++;
		
		$.ajax({
	
			url: url,
			type: 'GET',
			dataType: 'text',
			success: mbl_requests.parse_page
		});
		
		
	}

};


