define([
  'lscache', 'store/util/QueryResults', 'store/util/SimpleQueryEngine'
], function(
  lscache, QueryResults, SimpleQueryEngine
){


  /**
  * Original source from https://gist.github.com/880822
  * Ported to dojo-less AMD format, and to use pamelafox/lscache
  */
  var undef; 

  function LocalStorage(options){
    // summary:
    //  localStorage (lscache) based object store.
    // options:
    //  This provides any configuration information that will be mixed into the store.
    //  This should generally include the data property to provide the starting set of data.
    if(!lscache.supported()) {
      throw Error("LocalStorage not available on this device");
    }
    options = options || {};
    for(var i in options){
      this[i] = options[i];
    }
    this.setData(this.data || []);
  }

  LocalStorage.prototype = {

    idPrefix: '',
    
    // idProperty: String
    //  Indicates the property to use as the identity property. The values of this
    //  property should be unique.
    idProperty: "id",

    // queryEngine: Function
    //  Defines the query engine to use for querying the data store
    queryEngine: SimpleQueryEngine,
    get: function(id){
      //  summary:
      //  Retrieves an object by its identity
      //  id: Number
      //  The identity to use to lookup the object
      //  returns: Object
      //  The object in the store that matches the given id.
      return lscache.get(this.idPrefix + id);
    },
    getIdentity: function(object){
      //  summary:
      //  Returns an object's identity
      //  object: Object
      //  The object to get the identity from
      //  returns: Number
      return object[this.idProperty];
    },
    put: function(object, options){
      //  summary:
      //  Stores an object
      //  object: Object
      //  The object to store.
      //  options: Object?
      //  Additional metadata for storing the data.  Includes an "id"
      //  property if a specific id is to be used.
      //  returns: Number
      var id = options && options.id || object[this.idProperty] || Math.random();
      object[this.idProperty] = id;
      // add prefix to the localStorage key
      lscache.set(this.idPrefix + id, object);
      return id;
    },
    add: function(object, options){
      //  summary:
      //  Creates an object, throws an error if the object already exists
      //  object: Object
      //  The object to store.
      //  options: Object?
      //  Additional metadata for storing the data.  Includes an "id"
      //  property if a specific id is to be used.
      //  returns: Number
      if (this.get(object[this.idProperty])){
        throw new Error("Object already exists");
      }

      return this.put(object, options);
    },
    remove: function(id){
      //  summary:
      //  Deletes an object by its identity
      //  id: Number
      //  The identity to use to delete the object
      var exists = !!this.get(id);
      lscache.remove(this.idPrefx + id);
      return exists;
    },
    query: function(query, options){
      //  summary:
      //  Queries the store for objects.
      //  query: Object
      //  The query to use for retrieving objects from the store.
      //  options: store.util.SimpleQueryEngine.__queryOptions?
      //  The optional arguments to apply to the resultset.
      //  returns: store.util.QueryResults
      //  The results of the query, extended with iterative methods.
      //
      //  example:
      //  Given the following store:
      //
      //  | var store = new store.LocalStorage({
      //  |   data: [
      //  |   {id: 1, name: "one", prime: false },
      //  |   {id: 2, name: "two", even: true, prime: true},
      //  |   {id: 3, name: "three", prime: true},
      //  |   {id: 4, name: "four", even: true, prime: false},
      //  |   {id: 5, name: "five", prime: true}
      //  |   ]
      //  | });
      //
      //  ...find all items where "prime" is true:
      //
      //  | var results = store.query({ prime: true });
      //
      //  ...or find all items where "even" is true:
      //
      //  | var results = store.query({ even: true });

      var data=[], 
          key, 
          idPrefix = this.idPrefix, 
          offset = idPrefix.length; 
          
      for (var i=0; i<localStorage.length;i++){
        key = localStorage.key(i);
        // exclude all localStorage entries that don't use our prefix
        // this also excludes the lscache cache-prefix-ed entries
        if(key.indexOf(idPrefix) !== 0) {
          continue;
        }
        data.push(this.get(key.substring(offset)));
      }
      return QueryResults(this.queryEngine(query, options)(data));
    },
    setData: function(data){
      //  summary:
      //  Sets the given data as the source for this store, and indexes it
      //  data: Object[]
      //  An array of objects to use as the source of data.
      if(data.items){
        // just for convenience with the data format IFRS expects
        this.idProperty = data.identifier;
        data = this.data = data.items;
      }

      for(var i = 0, l = data.length; i < l; i++){
        var object = data[i];
        this.put(object);
      }
    }
  };
  return LocalStorage;
  
});