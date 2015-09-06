/* global app:true */

(function() {
  'use strict';

  var app = app || {};

  app.TwoStep = Backbone.Model.extend({
    url: '/twostep-login/',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      twostep: ''
    }
  });

  app.TwoStepView = Backbone.View.extend({
    el: '#twostep',
    template: _.template( $('#tmpl-twostep').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="password"]': 'loginOnEnter',
      'click .btn-twostep-login': 'login'
    },
    initialize: function() {
      this.model = new app.TwoStep();
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('[name="twostep"]').focus();
      return this;
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    loginOnEnter: function(event) {
      if (event.keyCode !== 13) { return; }
      event.preventDefault();
      this.login();
    },
    login: function() {
      this.$el.find('.btn-login').attr('disabled', true);

      this.model.save({
        code: this.$el.find('[name="twostep"]').val()
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
    app.TwoStepView = new app.TwoStepView();
  });
}());
