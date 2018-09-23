# angularjs-neoan-flatDb

Deployable, indexed, offline-first Database for AngularJS

Keeps the necessary abstraction-level for your apps when dealing with packaged, 
offline applications while providing queryable data.

###  [AngularJS](https://angularjs.org) module

```
angular.module('your-app',['neoan.nfdb']);
```

## Usage

>The usage depends on your type of application and differs greatly.
>This is just a very basic demonstration based on a common use-case.

### In JS
>! Inject $db !

```JS
// Connect to a destination (the file-ending .nfdb is optional). 
// A JSON format is required

$db.connect('data.nfdb').then(function(dbService){
    
    // You can assign the service to the current scope
    
    $scope.db = dbService;
    
    // Query data by object
    
    let results = $scope.db.query({inHere:{someKey:'someValue'}});        
            
     // The property attach() is provided to all arrays and objects to easily 
     // add entries.
     
     let newUser = {name:'Charlie', gender:'male'};
     results.forEach(function(item){
         item.attach(newUser).then(function(user){
              // 'user' contains attach-functions, its value as well as 
              // an id (_nId, (UUID)). Adding the member _nId in attach() enables 
              // the usage of own ids
         })
     });
     
     // To create or update data, to create a level-1 store 
     // or to create an indexed object prior to any attachments, use put()
     // e.g. creating entity for users
     $scope.db.put({'users':[]}).then(function(users){
         // 'users' contains attach-functions, an empty array as well as 
         // an id (_nId, (UUID)). Adding the member _nId in put() enables 
         // the usage of own ids
         
     })
});
```

### In HTML

```HTML
<button ng-click="charlies=db.query({blogs:{author:'Charlie'})">
    Get Charlie's blog posts! 
</button>
```
