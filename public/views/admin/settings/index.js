/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Settings = Backbone.Model.extend({
    initialize: function() {
      //for (var key in app.mainView.model) {
      //  if (app.mainView.model.hasOwnProperty(key)) {
      //    this.set(key, app.mainView.model[key].value);
      //  }
      //}
    },
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function() {
      return '/admin/settings';
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

  app.SettingsView = Backbone.View.extend({
    el: '#settings',
    template: _.template( $('#tmpl-settings').html() ),
    events: {
      'click .btn-update': 'update'
    },
    initialize: function() {
      this.model = new app.Settings();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      for (var key in this.model.attributes) {
        this.model.set(key, app.mainView.model.get(key));
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
        toSave[el.name] = el.value;

      });
      this.$el.find('.form-role select').each(function(i, el) {
        toSave[el.name] = el.value;
      });

      this.model.save(toSave);
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = new app.Settings( JSON.parse( unescape($('#data-record').html())) );

      app.headerView = new app.HeaderView();
      app.settingsView = new app.SettingsView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
