/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Emails = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function() {
      return '/admin/emails';
    },
    parse: function(response) {
      if (response.emails) {
        app.mainView.model.set(response.emails);
        delete response.emails;
      }

      return response;
    }
  });

  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template( $('#tmpl-header').html() ),

    initialize: function() {
      this.model = app.mainView.model;
      //this.listenTo(this.model, 'change', this.render);
      this.render();
    },

    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    }
  });

  app.EmailsView = Backbone.View.extend({
    el: '#emails',
    template: _.template( $('#tmpl-emails').html() ),
    events: {
      'click .btn-update': 'update',
      'click .btn-reset-secret': 'reset'
    },
    initialize: function() {
      this.model = new app.Emails();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      for (var key in app.mainView.model.attributes) {
        if (app.mainView.model.attributes.hasOwnProperty(key)) {
          this.model.set(key, app.mainView.model.get(key));
        }
      }
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    update: function() {
      var toSave = {};
      this.$el.find('.form-role input').each(function(i, el) {
        if (el.type === "checkbox") {
          el.value = el.checked === true ? 1 : 0;
        }
        toSave[el.name] = el.value;

      });
      this.$el.find('.form-role select').each(function(i, el) {
        toSave[el.name] = el.value;
      });

      this.model.save(toSave);
    },

    reset: function() {
      if (window.confirm("Your current Secret Key will no long work after reset.\nyou will need to update any application configuration using the old secret because it will no longer work.\nContinue?")) {
        this.modelReset.save();
      }
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = new app.Emails( JSON.parse( unescape($('#data-record').html())) );

      app.headerView = new app.HeaderView();
      app.emailsView = new app.EmailsView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
