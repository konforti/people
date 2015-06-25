WinChan=function(){function c(a,b,c){a.attachEvent?a.attachEvent("on"+b,c):a.addEventListener&&a.addEventListener(b,c,!1)}function d(a,b,c){a.detachEvent?a.detachEvent("on"+b,c):a.removeEventListener&&a.removeEventListener(b,c,!1)}function e(){var a=-1,b=navigator.userAgent;if("Microsoft Internet Explorer"===navigator.appName){var c=new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");null!=c.exec(b)&&(a=parseFloat(RegExp.$1))}else if(b.indexOf("Trident")>-1){var c=new RegExp("rv:([0-9]{2,2}[.0-9]{0,})");null!==c.exec(b)&&(a=parseFloat(RegExp.$1))}return a>=8}function f(){try{var a=navigator.userAgent;return-1!=a.indexOf("Fennec/")||-1!=a.indexOf("Firefox/")&&-1!=a.indexOf("Android")}catch(b){}return!1}function g(){return window.JSON&&window.JSON.stringify&&window.JSON.parse&&window.postMessage}function h(a){/^https?:\/\//.test(a)||(a=window.location.href);var b=document.createElement("a");return b.href=a,b.protocol+"//"+b.host}function i(){window.location;for(var c=window.opener.frames,d=c.length-1;d>=0;d--)try{if(c[d].location.protocol===window.location.protocol&&c[d].location.host===window.location.host&&c[d].name===a)return c[d]}catch(e){}}var a="__winchan_relay_frame",b="die",j=e();return g()?{open:function(e,g){function q(){if(k&&document.body.removeChild(k),k=void 0,o&&(o=clearInterval(o)),d(window,"message",r),d(window,"unload",q),n)try{n.close()}catch(a){m.postMessage(b,l)}n=m=void 0}function r(a){if(a.origin===l)try{var b=JSON.parse(a.data);"ready"===b.a?m.postMessage(p,l):"error"===b.a?(q(),g&&(g(b.d),g=null)):"response"===b.a&&(q(),g&&(g(null,b.d),g=null))}catch(c){}}if(!g)throw"missing required callback argument";var i;e.url||(i="missing required 'url' parameter"),e.relay_url||(i="missing required 'relay_url' parameter"),i&&setTimeout(function(){g(i)},0),e.window_name||(e.window_name=null),(!e.window_features||f())&&(e.window_features=void 0);var k,l=h(e.url);if(l!==h(e.relay_url))return setTimeout(function(){g("invalid arguments: origin of url and relay_url must match")},0);var m;j&&(k=document.createElement("iframe"),k.setAttribute("src",e.relay_url),k.style.display="none",k.setAttribute("name",a),document.body.appendChild(k),m=k.contentWindow);var n=window.open(e.url,e.window_name,e.window_features);m||(m=n);var o=setInterval(function(){n&&n.closed&&(q(),g&&(g("unknown closed window"),g=null))},500),p=JSON.stringify({a:"request",d:e.params});return c(window,"unload",q),c(window,"message",r),{close:q,focus:function(){if(n)try{n.focus()}catch(a){}}}},onOpen:function(a){function g(a){a=JSON.stringify(a),j?f.doPost(a,e):f.postMessage(a,e)}function h(b){var c;try{c=JSON.parse(b.data)}catch(f){}c&&"request"===c.a&&(d(window,"message",h),e=b.origin,a&&setTimeout(function(){a(e,c.d,function(b){a=void 0,g({a:"response",d:b})})},0))}function k(a){if(a.data===b)try{window.close()}catch(c){}}var e="*",f=j?i():window.opener;if(!f)throw"can't find relay frame";c(j?f:window,"message",h),c(j?f:window,"message",k);try{g({a:"ready"})}catch(l){c(f,"load",function(){g({a:"ready"})})}var m=function(){try{d(j?f:window,"message",k)}catch(b){}a&&g({a:"error",d:"client closed window"}),a=void 0;try{window.close()}catch(c){}};return c(window,"unload",m),{detach:function(){d(window,"unload",m)}}}}:{open:function(a,b,c,d){setTimeout(function(){d("unsupported browser")},0)},onOpen:function(a){setTimeout(function(){a("unsupported browser")},0)}}}();

(function() {
  'use strict';

  app = app || {};

  app.Register = Backbone.Model.extend({
    url: '/remote/register/social/',
    defaults: {
      errors: [],
      errfor: {},
      email: ''
    }
  });

  app.RegisterView = Backbone.View.extend({
    el: '#register',
    template: _.template( $('#tmpl-register').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="password"]': 'registerOnEnter',
      'click .btn-register': 'register'
    },
    initialize: function() {
      this.model = new app.Register();
      this.model.set('email', $('#data-email').text());
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('[name="email"]').focus();
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    registerOnEnter: function(event) {
      if (event.keyCode !== 13) { return; }
      event.preventDefault();
      this.register();
    },
    register: function() {
      this.$el.find('.btn-register').attr('disabled', true);

      this.model.save({
        email: this.$el.find('[name="email"]').val()
      },{
        success: function(model, response) {
          if (response.success) {
            $('.row').html('<div class="page-header"><h1>Registered Successfully</h1></div>');

            WinChan.onOpen(function(origin, r, cb) {
              cb({
                origin: response.origin,
                data: response,
                timestamp: new Date().toString()
              });
            });
          }
          else {
            model.set(response);
          }
        }
      });
    }
  });

  $(document).ready(function() {
    app.registerView = new app.RegisterView();
  });
}());
