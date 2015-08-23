/* global app:true */

(function() {
  'use strict';

  var app = app || {};

  app.Install = Backbone.Model.extend({
    url: '/install/',
    defaults: {
      errors: [],
      errfor: {},
      username: '',
      email: '',
      password: ''
    }
  });

  app.InstallView = Backbone.View.extend({
    el: '#identity',
    template: _.template( $('#tmpl-install').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="password"]': 'installOnEnter',
      'click .btn-install': 'install'
    },
    initialize: function() {
      this.model = new app.Install();
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
    installOnEnter: function(event) {
      if (event.keyCode !== 13) { return; }
      if ($(event.target).attr('name') !== 'password') { return; }
      event.preventDefault();
      this.install();
    },
    install: function() {
      this.$el.find('.btn-install').attr('disabled', true);

      this.model.save({
        username: this.$el.find('[name="username"]').val(),
        email: this.$el.find('[name="email"]').val(),
        password: this.$el.find('[name="password"]').val()
      },{
        success: function(model, response) {
          if (response.success) {
            location.href = '/admin/settings/';
          }
          else {
            model.set(response);
          }
        }
      });
    }
  });

  $(document).ready(function() {
    app.installView = new app.InstallView();
  });
}());
