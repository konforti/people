/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Rule = Backbone.Model.extend({
    idAttribute: '_id',
    url: function() {
      return '/admin/rules/'+ this.id +'/';
    }
  });

  app.Delete = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function() {
      return '/admin/rules/'+ app.mainView.model.id +'/';
    }
  });

  app.Details = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      name: '',
      event: '',
      and_or: '',
      conditions: [],
      actions: []
    },
    url: function() {
      return '/admin/rules/'+ app.mainView.model.id +'/';
    },
    parse: function(response) {
      if (response.rule) {
        app.mainView.model.set(response.rule);
        delete response.rule;
      }

      return response;
    }
  });

  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template( $('#tmpl-header').html() ),
    initialize: function() {
      this.model = app.mainView.model;
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    }
  });

  app.DetailsView = Backbone.View.extend({
    el: '#details',
    template: _.template( $('#tmpl-details').html() ),
    templateConditions: _.template( $('#tmpl-conditions').html() ),
    templateActions: _.template( $('#tmpl-actions').html() ),
    events: {
      'click .btn-update': 'update',
      'click .btn-addCondition': 'addCondition',
      'click .btn-addAction': 'addAction',
      'click .btn-delete': 'deleteItem'
    },
    initialize: function() {
      this.model = new app.Details();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        name: app.mainView.model.get('name'),
        event: app.mainView.model.get('event'),
        and_or: app.mainView.model.get('and_or'),
        conditions: app.mainView.model.get('conditions'),
        actions: app.mainView.model.get('actions')
      });
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }

      $('#conditions').html(this.templateConditions( this.model.attributes.conditions ));
      for (var key in this.model.attributes.conditions) {
        if (this.model.attributes.conditions.hasOwnProperty(key)) {
          $('#conditions').find('[name="'+ key +'"]').val(this.model.attributes.conditions[key]);
        }
      }

      $('#actions').html(this.templateActions( this.model.attributes.actions ));
      for (var key in this.model.attributes.actions) {
        if (this.model.attributes.actions.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    update: function() {
      var conditions = [];
      $('.condition').each(function(i, el) {
        var condition = {
          condition: $(el).find('[name="condition"]').val(),
          operator: $(el).find('[name="operator"]').val(),
          match: $(el).find('[name="match"]').val()
        };
        conditions.push(condition);
      });

      var actions = [];
      $('.action').each(function(i, el) {
        var action = {
          action: $(el).find('[name="action"]').val(),
          value: $(el).find('[name="value"]').val()
        };
        actions.push(action);
      });

      this.model.save({
        name: this.$el.find('[name="name"]').val(),
        events: this.$el.find('[name="event"]').val(),
        and_or: this.$el.find('[name="and-or"]').val(),
        conditions: conditions,
        actions: actions
      });
    },
    addCondition: function() {
      $('#conditions').append(this.templateConditions( this.model.attributes.conditions ));
    },
    deleteItem: function(e) {
      $(e.currentTarget).parent().remove();
    }
  });

  app.DeleteView = Backbone.View.extend({
    el: '#delete',
    template: _.template( $('#tmpl-delete').html() ),
    events: {
      'click .btn-delete': 'delete'
    },
    initialize: function() {
      this.model = new app.Delete({ _id: app.mainView.model.id });
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    },
    delete: function() {
      if (confirm('Are you sure?')) {
        this.model.destroy({
          success: function(model, response) {
            if (response.success) {
              location.href = '/admin/rules/';
            }
            else {
              app.deleteView.model.set(response);
            }
          }
        });
      }
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = new app.Rule( JSON.parse( unescape($('#data-record').html()) ) );

      app.headerView = new app.HeaderView();
      app.detailsView = new app.DetailsView();
      app.deleteView = new app.DeleteView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
