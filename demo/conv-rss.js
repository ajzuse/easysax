﻿var EasySax = require("../easysax.js");
//var crypto = require('crypto');


var rssParser = new function() {
	var u
	, unids = {}
	, context = 'root'

	, cnxStack = []
	, unidnext = 0
	, unidstack = []

	, text = ''
	, item = {}
	, items = []
	, feed = {items: items}

	, isPermaLink = false
	;

	function reset() { // сброс значений
		var _feed = feed;

		context = 'root';

		text = '';
		items = [];
		feed = {items: items};
		
		unids = {};
		cnxStack = [];
		unidstack = [];
		unidnext = 0;
		
		return _feed;
	};


	function onTextNode(x, uq) {
		switch(context) {
			case 'TEXT':
				text += uq(x);
				break;
		};
	};

	function onCDATA(x) {
		switch(context) {
			case 'TEXT':
				text += x;
				break;
		};
	};

	function onStartNode(elem, attr){
		var unid = unidnext++, attrs;

		unidstack.push(unid);
		cnxStack.push(context);
		
		

		if (!context) return;


		switch(context) {
			case 'TEXT': return;
			

			case 'root':
				if (elem === 'rss:rss' || elem === 'rdf:RDF') {
				//if (elem === 'rss:rss') {
					unids.root = unid;
					return;
				};
				
				if (elem === 'rss:channel') {
					return;
				};


				if (elem === 'rss:item') {
					unids.item = unid;
					context = 'item';
					isPermaLink = false;
					return;
				};
				
				if (elem === 'rss:title') {
					context = 'TEXT';
					unids.rootTitle = unid;
					return;
				};
				
				if (elem === 'rss:link') {
					context = 'TEXT';
					unids.rootLink = unid;
					return;
				};

				break;

			case 'item':
				
				if (elem === 'rss:title') {
					unids.itemTitle = unid;
					context = 'TEXT';
					return;
				};
				
				if (elem === 'rss:link') {
					unids.itemLink = unid;
					context = 'TEXT';
					return;
				};
				
				if (elem === 'rss:description') {
					unids.itemDescription = unid;
					context = 'TEXT';
					return;
				};

				if (elem === 'rss:pubDate') {
					unids.itemPubDate = unid;
					context = 'TEXT';
					return;
					
				};

				if (elem === 'rss:guid') {
					unids.itemID = unid;
					context = 'TEXT';

					attrs = attrs || attr();
					if (attrs === null) {
						// error parser
						//return;
						attrs = false;
					};

					isPermaLink = attrs.isPermaLink !== 'false';
					return;
				};

				break;
		};
		

		context = null;
	};

	function onEndNode(elem){
		var unid = unidstack.pop(unid), x;
		context = cnxStack.pop(context);

		switch(unid) {
			case unids.root:
				//feed.items = items;

				unids = {};
				break;

			case unids.rootTitle:
				feed.title = text;
				text = '';
				break;
			
			case unids.rootLink:
				feed.link = text;
				text = '';
				break;

			case unids.item:
				if (!item.link && isPermaLink && item.guid) {
					item.link = item.guid;
				};

				if (item.guid) {
					feed.streamed = true;
				};

				items.push(item);

				item = {};
				break;

			case unids.itemTitle:
				item.title = text;
				text = '';
				break;

			case unids.itemLink:
				item.link = text;
				text = '';
				break;

			case unids.itemDescription:
				item.desc = text;
				text = '';
				break;

			case unids.itemPubDate:
				x = +new Date(text);
				//if (x != x) x = +new Date();
				if (x != x) x = null;

				item.utime = Math.floor(x/1000);

				text = '';
				break;
			
			case unids.itemID:
				item.guid = text;
				text = '';
				break;
			
		};
	};
	



	var parser = new EasySax();

	parser.ns('rss', {
		//'http://search.yahoo.com/mrss/': 'media',
		'http://purl.org/rss/1.0/': 'rss',
		'http://www.w3.org/1999/02/22-rdf-syntax-ns#' : 'rdf',
		'http://backend.userland.com/rss2': 'rss'
	});

	parser.on('error', null);
	parser.on('startNode', onStartNode);
	parser.on('endNode', onEndNode);
	parser.on('textNode', onTextNode);
	parser.on('cdata', onCDATA);


	function rssParser(xml) {
		parser.parse(xml);
		return reset();
	};
	
	return rssParser;
};


if (typeof exports === 'object' && this == exports) {
	module.exports = rssParser;
};

