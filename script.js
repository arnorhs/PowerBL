


$(document).ready(function () {

	mbl_urls.start_retrieval();
	
	/* b�ta vi� events fyrir a� sko�a spjall �r�� osfrv */
	$('a.powerbl-comments').live('click',function () {
		
		var $comment_div = $(this).next();
		
		if ($comment_div.html().length > 0) {
			$comment_div.html('').removeClass('active');
		} else {
			// passa a� allir s�u loka�ir
			$('div.powerbl-comments').html('').removeClass('active');
			$comment_div.append(powerbl.disqus_code($comment_div.attr('uid'))).addClass('active');
		}
	});
	
	// ef notandinn scrollar, loada vi�komandi contenti
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

	/* format � listi breytu: {
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
					(item.img ? '<img src="'+item.img+'" alt="mynd me� fr�tt" />' : '') +
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

		// byrjum � a� ra�a � r�tta r��
		powerbl.listi.sort(function(a,b){
			return b.timestamp.localeCompare(a.timestamp);
		})
		
		// hreinsa contenti� sem var fyrir
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
		Fer � gegnum alla elements (allar fr�ttir) og finnur �t hvort ��r
		s�u sta�settar innan gluggans - ef svo er, �� skilar hann �eim 
	*/
	uids_within_window: function(){
		var uids = [];
		var range = {top: $(window).scrollTop(), bottom: $(window).scrollTop() + $(window).height() };
		// �ttum kannski a� b�ta sm� vi�, svo �a� ver�i ekki svo miki� delay �egar notandinn skrollar
		// hef�um kannski aldrei �urft window height.. ???
		// s��an st�kkar glugginn l�ka ge�veikt miki� �egar textinn b�tist vi�..  hmmm
		range.bottom = range.bottom + 500;

		$('#powerbl-content ul li').each(function(){
			// �urfum bara a� athuga efri l�nuna
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
	
	// b�r til ajax kall sem s�kir allan texta vi� einhverja mbl grein
	load_single_content: function (uid) {
	
		// athugum fyrst hvort �a� var b�i� a� �v�
		if ($("li[uid='"+uid+"'] div.fulltext").html().length > 0) {

			return;
		}
		
		$("li[uid='"+uid+"'] div.fulltext").html('<div class="loading"></div>');
		
		//pff.. �etta uid er � raun bara url - g�ti alltaf breyst ef vi� b�tum vi� V�sir.is e�a eitthva�
		$.ajax({
			url: uid,
			type: 'GET',
			dataType: 'text',
			success: powerbl.insert_single_content			
		});
	},
	
	insert_single_content: function (text) {
	
	
		// byrjum � a� skipta �t textanum....
		
		var content = '';
	
		$(text).find('p.maintext').each(function(){
			content = content + '<p>'+$(this).html()+'</p>';
		});
		
		// myndin
		var imgsrc = $(text).find('div.newsimg-left img:not(.magnify)').attr('src');
	
	
		var $element = $("li[uid='"+this.url+"']");
		$element.find('div.fulltext').html(content);
		$element.find('p.intro').remove();
		
		// s��an skiptum vi� �t myndinni
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
		// virka�i einhverra hluta vegna ekki a� nota .find()		
		$(html).filter('div').filter('.newslist-item, #toppfrett').each(function () {
		
			if (typeof ($(this).find('h4 a').attr('href')) != 'undefined') { // sj�um hvort linkur s� � r�ttum sta� � element
				// �� �ttum vi� a� vera good to go
				mbl_requests.parse_item(this);
				
				//console.log(linkur.match(/\/\d{4}\/\d{2}\/\d{2}\//)[0] );
				count++;
			}
		});
		
		mbl_requests.nor--;

		// renderum � hvert skipti sem �a� kemur eitthva� n�tt
		powerbl.render();
		
		// athugum hvort �etta var s��asti - �� skulum vi� h�tta a� loada
		if (mbl_requests.nor < 1) {
			powerbl.stop_load();
			powerbl.check_boundary();
		}
		
	},
	
	fetch_full_text: function (url) {
		
	},
	
	parse_item: function (div) {
		var $div = $(div);
		
		// undirflokkur, a�alflokkur, dags, t�mi
		var misc = $div.find('.tiny.gray').text();
		
		var url = $div.find('h4 a').attr('href');
		
		var texti = mbl_requests.parse_texti($div.find('p.smallish').html());
		
		var new_item = {
			"url": 'http://mbl.is'+url,
			"titill": $div.find('h4').text(),
			"timestamp": mbl_requests.parse_timestamp(url, misc), // �urfum l�ka urlil� - a�eins ��gilegra af �v� �a� vantar �r � dags.
			"texti": texti, // t�kum htmli� �v� �a� g�tu veri� external linkar sem vi� viljum halda
			"img": ($div.find('img').length > 0) ? 'http://mbl.is'+$div.find('img').attr('src') : ''
		}	
		
		powerbl.add(new_item)
		
	},
	
	parse_texti: function (txt) {
	
		if (!txt) return '';
	
		var $txt = $('<div>'+txt+'</div>');
		// �urfum a� loopa � gegnum linka og skipta �t urlinu, ef �a� vantar http
		$txt.find('a').each(function() {

			$(this).attr('href', ($(this).attr('href').search("http://") == -1) ? 'http://mbl.is'+$(this).attr('href') : $(this).attr('href'))
		});
		return $txt.html();
	
	},
	
	/*
		�essi function mun vonandi skila t�ma � �essu formi: YYYYMMDDHHMM
	*/
	parse_timestamp: function (url, str) {
	
		var dags = url.match(/\d{4}\/\d{2}\/\d{2}/)[0].split('/');
	
		var timi = str.split('|')[3].split(':'); // �tti a� skila array me� gildunum kls + m�n�tur
		for (var i in timi) {
			timi[i] = timi[i].replace(/^\s+|\s+$/g,"");
			// ef hann er bara 1 t�lustafur
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


