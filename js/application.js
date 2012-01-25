// models
Models = {};

Models.User = Backbone.Model.extend({
    initialize: function() {
        this.bind('change:userid', this.setForumProfileLink());
    },

    setForumProfileLink: function() {
        this.set({forumProfileLink: 'http://www.sk.rs/forum/member.php?u=' + this.get('userid')});
    }
});

Models.UserScorePair = Backbone.Model.extend({});

Models.Challenge = Backbone.Model.extend({
    defaults: {
        caseUrls: 'https://raw.github.com/proof/programming-challenges/gh-pages/$slug/testcases/$name-$type-$num.$ext',
        descriptionUrl: 'https://raw.github.com/proof/programming-challenges/gh-pages/$slug/description.json',
        sourceUrl: 'https://raw.github.com/proof/programming-challenges/gh-pages/$slug/source/$user.$ext'
    },

    initialize: function() {
        this.bind('change:id', this.computeSlug, this);
        this.bind('change:name', this.computeSlug, this);
        this.bind('change:endDate', this.checkForCompletion, this);
        this.computeSlug();
        this.checkForCompletion();
    },

    checkForCompletion: function() {
        if (_.isUndefined(this.get('endDate'))) return;

        var today = new Date();
        this.set({finished: (this.get('endDate') <= today) ? true : false});
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

    hasUser: function(user) {
        if (!_.isUndefined(this.get('users')))
            return this.get('users').findUser(user);

        return false;
    },

    addUser: function(user, score, source) {
        if (_.isUndefined(this.get('users')))
            this.set({users: new Collections.UserScorePairs()});

        if (_.isUndefined(source))
            source = false;
        else {
            source = this.get('sourceUrl')
                .replace('$slug', this.get('slug')).replace('$user', user.get('username')).replace('$ext', source);
        }

        this.get('users').add(new Models.UserScorePair({
            user: user,
            score: score,
            source: source,
            calculatedScore: this.get('score')(score)
        }));
    },

    getDetailed: function() {
        if (_.isUndefined(this.get('detailed'))) {
            $.ajax({
                url: this.getDescriptionUrl(),
                type: 'GET',
                dataType: 'script'
            });

            return undefined;
        }

        return this.get('detailed');
    },

    getDescriptionUrl: function() {
        return this.get('descriptionUrl').replace('$slug', this.get('slug'));
    },

    getTestcaseUrl: function(type, testcase, ext) {
        if (_.isUndefined(ext)) ext = 'in';

        return this.get('caseUrls')
            .replace('$slug', this.get('slug'))
            .replace('$name', this.get('sanitizedName'))
            .replace('$type', type)
            .replace('$num', testcase)
            .replace('$ext', ext);
    }
});

// collections
Collections = {};

Collections.Users = Backbone.Collection.extend({
    model: Models.User,

    findByName: function(username) {
        return this.find(function(user){
            return username == user.get('username');
        });
    },

    findUser: function(user) {
        return this.find(function(u){
            return user.get('userid') == u.get('userid');
        });
    }
});

Collections.UserScorePairs = Backbone.Collection.extend({
    model: Models.UserScorePair,

    comparator: function(userScorePair) {
        return -userScorePair.get('calculatedScore');
    },

    findByName: function(username) {
        return this.find(function(userScorePair) {
            return username == userScorePair.get('user').get('username');
        });
    },

    findUser: function(user) {
        return this.find(function(userScorePair){
            return user.get('userid') == userScorePair.get('user').get('userid');
        });
    }
});

Collections.Challenges = Backbone.Collection.extend({
    model: Models.Challenge,

    findChallengesByUser: function(user) {
        return this.filter(function(challenge){
            return (challenge.hasUser(user) != false);
        });
    }
});

Users = new Collections.Users();
Challenges = new Collections.Challenges();

// views
Views = {};

$(function(){

    Views.ChallengesList = Backbone.View.extend({
        tagName: 'ul',
        className: 'main-list',

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

        events: {
            'click ol li .check': 'checkClick'
        },

        initialize: function() {
            _.bindAll(this, 'render', 'checkClick');
            this.model.bind('change:detailed', this.render, this)
        },

        render: function() {
            if (_.isUndefined(this.model.getDetailed()))
                $(this.el).html(this.templateNotReady(this.model.toJSON()));
            else {
                $(this.el).html(this.template(this.model.toJSON()));
                var competitorsView = new Views.ChallengeCompetitorsList({model: this.model});
                $(this.el).append(competitorsView.render().el);
            }
            
            return this;
        },

        checkClick: function(e) {
            e.preventDefault();
            var id = $(e.target).attr('data-id');
            var type = $(e.target).attr('data-type');

            var view = new Views.ChallengeCheckInput({model: this.model});
            view.context = {id: id, type: type.charAt(0).toUpperCase() + type.slice(1)};
            this.$('#input-check').empty().append(view.render().el);
        }
    });

    Views.ChallengeCheckInput = Backbone.View.extend({
        template: _.template($('#challenge-check').html()),

        events: {
            'click .btn.primary': 'clickButton',
            'click .btn.info': 'removeView'
        },

        initialize: function() {
            _.bindAll(this, 'render', 'clickButton');
        },

        render: function() {
            $(this.el).html(this.template(this.context));
            return this;
        },

        clickButton: function(e) {
            e.preventDefault();
            var btn = $(e.target);

            this.input = this.$('#check-textarea').val().replace("\r", "").replace("\n", " ").replace(/\s+/g, " ").
                replace(/^\s+/g, "").replace(/\s+$/g, "");
            $(this.el).append('<div class="loading"></div>');
            RemoteScriptHandler.checkerView = this;

            $.ajax({
                url: this.model.getTestcaseUrl(this.context.type.toLowerCase(), this.context.id, 'out'),
                type: 'GET',
                dataType: 'script'
            });
        },

        callback: function(data) {
            data = data.replace("\r", "").replace("\n", " ").replace(/\s+/g, " ").
                replace(/^\s+/g, "").replace(/\s+$/g, "");
            this.$('.loading').remove();

            console.log(data);
            console.log(this.input);
            console.log(data.length, this.input.length);

            if (data == this.input) {
                this.$('.btn.primary').addClass('disabled').addClass('success').removeClass('primary').html('Uspesno!');
                return;
            }
            
            this.$('.btn.primary').addClass('disabled').addClass('danger').removeClass('primary').html('Greška!');
        },

        removeView: function(e) { e.preventDefault(); this.remove(); }
    });

    Views.ChallengeCompetitorsList = Backbone.View.extend({
        tagName: 'div',
        template: _.template($('#challenge-competitors').html()),

        render: function() {
            $(this.el).empty();
            if (this.model.get('finished')) {
                $(this.el).html(this.template(this.model.toJSON()));

                var el = this.$('.bordered-table');
                this.model.get('users').each(function(model){
                    var view = new Views.ChallengeCompetitorsListItem({model: model});
                    el.append(view.render().el);
                });
            }
            
            return this;
        }
    });

    Views.ChallengeCompetitorsListItem = Backbone.View.extend({
        tagName: 'tr',
        template: _.template($('#challenge-competitor-list').html()),

        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        }
    });
});

RemoteScriptHandler = {};
RemoteScriptHandler.currentView = null;
RemoteScriptHandler.checkerView = null;
RemoteScriptHandler.handle = function(data) {
    RemoteScriptHandler.currentView.model.set({detailed: data});
}
RemoteScriptHandler.handleOut = function(data) {
    RemoteScriptHandler.checkerView.callback(data);
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
