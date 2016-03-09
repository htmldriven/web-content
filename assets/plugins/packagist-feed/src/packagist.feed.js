/**
 * packagist-feed v0.5.0
 * https://github.com/htmldriven/packagist-feed
 *
 * Copyright (c) 2016 Jiri Rebenda, HTMLDriven
 * MIT License
 * http://opensource.org/licenses/MIT
 */

var Packagist = (function(document, undefined) {
	'use strict';
	
	var obj = {};
	
	var methods = {
		sendRequest: function(url, success, error) {
			var request = new XMLHttpRequest();
			request.open('GET', url);
			
			request.setRequestHeader('Accept', 'application/json');

			request.onreadystatechange = function() {
				if (request.readyState === 4) {
					if (request.status >= 200 && request.status < 300) {
						var data = JSON.parse(request.responseText);
						success(data);
					} else {
						error('request for ' + url + ' yielded status ' + request.status);
					}
				}
			};

			request.onerror = function() {
				error('An error occurred connecting to ' + url);
			};
			request.send();
		},
		getElement: function(selector) {
			return selector.charAt(0) === '#' ? document.getElementById(selector.substring(1)) : document.getElementsByClassName(selector.substring(1));
		},
		getAsyncPackageInfo: function(packageName, success) {
			var packageUrl = 'http://cors-proxy.htmldriven.com/?url=https://packagist.org/packages/' + packageName + '.json';
			this.sendRequest(
				packageUrl,
				function(data) {
					var body = JSON.parse(data.body);
					
					var packageInfo = body.package || null;
					var gitHubApiUrl = packageInfo.repository.replace('https://github.com', 'https://api.github.com/repos');
					
					methods.sendRequest(
						gitHubApiUrl,
						function(data) {
							packageInfo.language = data.language || '';
							packageInfo.stars = data.stargazers_count || 0;
							
							success(packageInfo);
						},
						function(message) {
							console.log(message);
						}
					);
					
				},
				function(message) {
					console.log(message);
				}
			);
		},
		renderPackagesList: function(vendor, container, data) {
			var body = JSON.parse(data.body);
			
			var packages = body.packageNames;
			
			var headerElement = document.createElement('div');
			headerElement.setAttribute('class', 'pf-header');
			
			var packagistLogoElement = document.createElement('img');
			packagistLogoElement.setAttribute('class', 'pf-packagist-logo');
			packagistLogoElement.setAttribute('src', 'https://packagist.org/bundles/packagistweb/img/logo-small.png');
			headerElement.appendChild(packagistLogoElement);
			
			var vendorNameElement = document.createElement('div');
			vendorNameElement.setAttribute('class', 'pf-vendor-name');
			vendorNameElement.innerHTML = '<a href="https://packagist.org/users/' + vendor + '/packages/">' + vendor + '</a>';
			headerElement.appendChild(vendorNameElement);
			
			var list = document.createElement('ul');
			list.setAttribute('class', 'pf-packages-list');
			
			for (var i = 0; i < packages.length; i++) {
				var packageName = packages[i];
				methods.getAsyncPackageInfo(packageName, function(packageInfo) {
					// package info
					var packageName = packageInfo.name;
					var packageLink = 'https://packagist.org/packages/' + packageName;
					var packageLanguage = packageInfo.language || '';
					var packageDescription = packageInfo.description || '';
					var packageInstalls = packageInfo.downloads !== undefined ? (packageInfo.downloads.total || 0) : '';
					var packageStars = packageInfo.stars || 0;

					// package info container
					var packageInfoContainer = document.createElement('div');
					var packageNameElement = document.createElement('h4');
					var packageLinkElement = document.createElement('a');
					var packageLanguageElement = document.createElement('p');
					var packageDescriptionElement = document.createElement('p');

					packageLanguageElement.setAttribute('class', 'pf-language');
					packageLanguageElement.innerHTML = packageLanguage;
					packageInfoContainer.appendChild(packageLanguageElement);

					packageLinkElement.setAttribute('href', packageLink);
					packageLinkElement.innerHTML = packageName;
					packageNameElement.setAttribute('class', 'font-bold');
					packageNameElement.appendChild(packageLinkElement);
					packageInfoContainer.appendChild(packageNameElement);

					packageDescriptionElement.innerHTML = packageDescription;
					packageInfoContainer.appendChild(packageDescriptionElement);

					// package stats
					var packageStatsContainer = document.createElement('p');

					// installs
					var installsElement = document.createElement('span');
					var installsIcon = document.createElement('i');

					installsIcon.setAttribute('class', 'glyphicon glyphicon-arrow-down pf-stats-icon');
					installsElement.setAttribute('class', 'pf-stats-item');
					installsElement.appendChild(installsIcon);
					installsElement.appendChild(document.createTextNode(' ' + packageInstalls.toString())); // intentionally prefixed with a single space
					packageStatsContainer.appendChild(installsElement);

					// stars
					var starsElement = document.createElement('span');
					var starsIcon = document.createElement('i');

					starsIcon.setAttribute('class', 'glyphicon glyphicon-star pf-stats-icon');
					starsElement.setAttribute('class', 'pf-stats-item');
					starsElement.appendChild(starsIcon);
					starsElement.appendChild(document.createTextNode(' ' + packageStars.toString())); // intentionally prefixed with a single space
					packageStatsContainer.appendChild(starsElement);

					packageInfoContainer.setAttribute('class', 'pf-package-info');
					packageStatsContainer.setAttribute('class', 'pf-package-stats');

					// package item finalization
					var packageItemElement = document.createElement('li');
					packageItemElement.setAttribute('class', 'pf-package-item');
					packageItemElement.appendChild(packageInfoContainer);
					packageItemElement.appendChild(packageStatsContainer);
					list.appendChild(packageItemElement);
				});
			}
			
			container.innerHTML = '';
			container.appendChild(headerElement);
			
			if (packages.length > 0) {
				container.appendChild(list);
			} else {
				var noPackagesFoundAlertElement = document.createElement('div');
				var noPackagesFoundMessageElement = document.createElement('p');
				
				noPackagesFoundMessageElement.appendChild(document.createTextNode('No packages found.'));
				
				noPackagesFoundAlertElement.setAttribute('class', 'alert alert-danger');
				noPackagesFoundAlertElement.appendChild(noPackagesFoundMessageElement);
				
				container.appendChild(noPackagesFoundAlertElement);
			}
		}
	};
	
	obj.feed = function(options) {
		if (!options.vendor) {
			throw 'Please provide a vendor name.';
		} else if (!options.selector) {
			throw 'Please provide a selector of target HTML element which should contain feed content.';
		};
		
		var vendor = options.vendor;
		var selector = options.selector;
		
		var container = methods.getElement(selector);
		
		// due to cross-domain request restriction, mediator service is needed
		var vendorPackagesUrl = 'http://cors-proxy.htmldriven.com/?url=https://packagist.org/packages/list.json?vendor=' + vendor;
		
		methods.sendRequest(
			vendorPackagesUrl,
			function(data) {
				methods.renderPackagesList(vendor, container, data);
			},
			function(message) {
				console.log(message);
			}
		);
	};
	
	return obj;
})(document);
