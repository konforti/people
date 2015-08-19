/* global app:true */

(function() {
  'use strict';

  var app = app || {};

  app.Register = Backbone.Model.extend({
    url: '/register/social/',
    defaults: {
      errors: [],
      errfor: {},
      email: '',
      id: '',
      username: '',
      provider: ''
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
      this.model.set('record', $('#data-record').text());
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
        email: this.$el.find('[name="email"]').val(),
        id: this.model.record.id,
        username: this.model.record.username,
        provider: this.model.record.provider
      },{
        success: function(model, response) {
          if (response.success) {
            location.href = '/';
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
