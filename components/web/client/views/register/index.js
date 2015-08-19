/* global app:true */

(function() {
  'use strict';

  var app = app || {};

  app.Register = Backbone.Model.extend({
    url: '/register/',
    defaults: {
      errors: [],
      errfor: {},
      username: '',
      email: '',
      password: ''
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
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('[name="username"]').focus();
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    registerOnEnter: function(event) {
      if (event.keyCode !== 13) { return; }
      if ($(event.target).attr('name') !== 'password') { return; }
      event.preventDefault();
      this.register();
    },
    register: function() {
      this.$el.find('.btn-register').attr('disabled', true);

      this.model.save({
        username: this.$el.find('[name="username"]').val(),
        email: this.$el.find('[name="email"]').val(),
        password: this.$el.find('[name="password"]').val()
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
