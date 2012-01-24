// models
Models = {};

Models.User = Backbone.Model.extend({});

Models.Challenge = Backbone.Model.extend({
    defaults: {
        caseUrls: 'https://raw.github.com/proof/programming-challenges/gh-pages/$slug/testcases/$name-$type-$num.in',
        descriptionUrl: 'https://raw.github.com/proof/programming-challenges/gh-pages/$slug/description.json'
    },

    initialize: function() {
        this.bind('change:id', this.computeSlug, this);
        this.bind('change:name', this.computeSlug, this);
        this.computeSlug();
    },

    computeSlug: function() {
        var name = this.get('name').toLowerCase().replace(/\s+/g, '-');
        var slug = this.get('id') + '-' + name;

        this.set({
            sanitizedName: name,
            slug: slug,
            route: '#challenge/' + slug
        });
    },

    getSlug: function() {
        return this.get('slug');
    },

    getDetailed: function() {
        if (_.isUndefined(this.get('detailed'))) {
            $.ajax({
                url: this.getDescriptionUrl(),
                type: 'GET',
                dataType: 'script'
            });
            /*$.jsonp({
                url: this.getDescriptionUrl() + '?callback=?',
                context: this,
                dataFilter: function(data) {
                    console.log(data);
                    return data;
                },
                success: function(data) {
                    this.set({detailed: data});
                }
            });*/

            return undefined;
        }

        return this.get('detailed');
    },

    getDescriptionUrl: function() {
        return this.get('descriptionUrl').replace('$slug', this.get('slug'));
    },

    getTestcaseUrl: function(type, testcase) {
        return this.get('caseUrls')
            .replace('$slug', this.get('slug'))
            .replace('$name', this.get('sanitizedName'))
            .replace('$type', type)
            .replace('$num', testcase);
    }
});

// collections
Collections = {};

Collections.Users = Backbone.Collection.extend({
    model: Models.User
});

Collections.Challenges = Backbone.Collection.extend({
    model: Models.Challenge
});

Challenges = new Collections.Challenges();

// views
Views = {};

$(function(){

    Views.ChallengesList = Backbone.View.extend({
        tagName: 'ul',

        initialize: function() {
            this.collection.bind('reset', this.render, this);
        },

        render: function() {
            var el = this.el;
            $(el).empty();

            this.collection.each(function(model) {
                var view = new Views.ChallengeListItem({ model: model });
                $(el).append(view.render().el);
            });

            return this;
        }
    });

    Views.ChallengeListItem = Backbone.View.extend({
        tagName: 'li',
        template: _.template($('#challenge-list').html()),

        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        }
    });

    Views.Challenge = Backbone.View.extend({
        tagName: 'div',
        template: _.template($('#challenge').html()),
        templateNotReady: _.template($('#challenge-not-ready').html()),

        initialize: function() {
            this.model.bind('change:detailed', this.render, this)
        },

        render: function() {
            if (_.isUndefined(this.model.getDetailed()))
                $(this.el).html(this.templateNotReady(this.model.toJSON()));
            else
                $(this.el).html(this.template(this.model.toJSON()));
            
            return this;
        }
    });

});

RemoteScriptHandler = {};
RemoteScriptHandler.currentView = null;
RemoteScriptHandler.handle = function(data) {
    RemoteScriptHandler.currentView.model.set({detailed: data});
}

$(function(){
    // application
    var Router = Backbone.Router.extend({
        routes: {
            '': 'home',
            'challenge/:challenge': 'viewChallenge'
        },

        home: function() {
            var challengesView = new Views.ChallengesList({collection: Challenges});
            $('#content').empty().append(challengesView.render().el);
        },

        viewChallenge: function(challenge) {
            var challengeModel = Challenges.filter(function(model) {
                return model.getSlug() == challenge;
            })[0];

            var challengeView = new Views.Challenge({model: challengeModel});
            RemoteScriptHandler.currentView = challengeView;
            $('#content').empty().append(challengeView.render().el);
        }
    });

    window.router = new Router();
    Backbone.history.start();
});
