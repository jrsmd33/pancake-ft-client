define([
  'dollar', 
  'lang', 
  'knockout', 
  'compose',
  'pancake', 
  'lib/page',
  'lib/url',
  'lib/template',
  'viewmodel/page',
  'viewmodel/searchbox',
  'viewmodel/history',
  'services/settings', 
  'services/search', 
  // knockout extensions
  'lib/knockout.wireTo',
  'lib/knockout.composeWith',
  'lib/knockout.classlist'
], function($, lang, ko, Compose, Pancake, Page, Url, template, PageViewModel, SearchBox, HistoryViewModel, settings, services){
  Pancake.log("log", "home.app loaded");

  window.services = services; 

  // page has a lifecycle: initialize, applyBindings
  var app = window.app = Compose.create(Page, {
    el: 'body',
    applyBindings: function(viewModel){
      var selfNode = $(this.el)[0];
      ko.applyBindings(viewModel || this, selfNode);
      return this;
    },
    loadSearch: function(terms) {
      var url = Url.parse(location.href, settings.applicationRoot() + 'results.html#search/'+ terms).toString();
      return Pancake.openAppView(url);
    }
  });

  var viewModel = app.viewModel = Compose.create(PageViewModel, { 
    searchbox: SearchBox,
    history: HistoryViewModel,
    parent: app, // give the viewModel a reference to its owner
    
    settings: settings,
    
    suggestions: ko.observableArray([]),
    
    suggestionClick: function(bindingContext, evt){
      // handling for the typeahead search suggestions
      // intercept link clicks and route them through the Pancake.* API methods
      if(evt.altKey || evt.ctrlKey || evt.metaKey) {
        console.log("Passing alt/ctrl/meta click through: ", evt);
        return;
      }
      if(evt.which && evt.which === 3) {
        console.log("Passing right-click through: ", evt);
        return;
      }
      evt.preventDefault();
      var node = evt.target, 
          itemNode = $(evt.target).closest('li')[0], 
          terms = node.getAttribute('data-terms') || node.text || node.textContent || node.innerText; 

      // do the suggested search
      viewModel.searchbox.value(terms);
      app.loadSearch( terms );

      // clear the suggestions list when we're done
      setTimeout(function(){
        var suggestions = app.viewModel.suggestions;
        suggestions.splice(0, suggestions().length);
      }, 100);
    },
    
    go: function(){
      var terms = viewModel.searchTerms() || viewModel.searchbox.value();
      app.loadSearch( terms );
    },

    searchTerms: ko.observable(''),     // debounced, intentional value

    // handler for login clicks
    login: function(){
      if(settings.session()) {
        app.logout();
      } else {
        app.login();
      }
    }
  });
  // wire up the submit stub method to our 'go' submitter
  viewModel.searchbox.submit = viewModel.go;
  
  viewModel.searchbox.value.subscribe( lang.debounce(function(terms){
      // de-bounce before setting terms on the viewModel
    console.log("debounced searchbox.value:", terms);
  }, 300));

  settings.session.subscribe(function(sessionValue){
    // session/username change, invalidates all/most of the records in our store
    // get the new stuff
    services.stack.activeStacks(null, { refresh: true });
  });

  app.applyBindings(viewModel);
  
});