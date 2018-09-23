angular.module('neoan.flatDb', [])
    .filter('indexFilter', function () {
        return function (items, index) {
            if (!angular.isDefined(index) || index === '') {
                return items;
            }
            let filtered = [];
            angular.forEach(items, function (item) {
                if (item.hasOwnProperty(index)) {
                    filtered.push(item);
                }
            });
            return filtered;
        };
    })
    .service('$db', ['$http', '$q', '$filter', function ($http, $q, $filter) {
        let service = {
            _memory: {
                array: [],
                indexedObj: {}
            }
        };
        let readFrom = [];
        let tester;
        let currentLvl1;
        let operations = {
            deepen: function (array) {
                let handle = {};
                if (typeof array['_nId'] !== 'undefined') {
                    currentLvl1 = array['_nId'];
                }
                angular.forEach(array, function (entry, ind) {
                    if (Array.isArray(entry)) {
                        if (entry.length === 0) {
                            handle[ind] = [];
                        } else {
                            handle[ind] = operations.deepen(entry);
                        }
                        operations.provideProto(handle[ind], currentLvl1, ind);
                    } else {
                        if (entry.hasOwnProperty('_nId') && Object.keys(entry).length === 1) {
                            tester = $filter('indexFilter')(readFrom, entry._nId);
                            if (tester.length < 1) {
                                return;
                            }
                            handle[ind] = operations.deepen(
                                tester[0][entry._nId]
                            );
                            operations.provideProto(handle[ind], currentLvl1, ind);
                        } else if (typeof entry === 'object' && entry !== null) {
                            angular.forEach(entry, function (value, key) {
                                handle[key] = operations.deepen(value);
                            });
                        } else {
                            handle[ind] = entry;
                        }
                    }
                });
                return handle;
            },
            uuid: function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            attachIterator: function(newObj,lvl1,lvl2){
                return $q(function(resolve){
                    service.put(newObj).then(function(res){
                        const pusher = {_nId:res._nId};
                        angular.forEach(readFrom, function (top, i) {
                            if (Object.keys(top)[0] === lvl1) {
                                readFrom[i][lvl1][lvl2].push(pusher);
                            }
                        });
                        resolve(operations.initialize());
                    });
                });
            },
            provideProto: function (obj, lvl1, lvl2) {
                if (Array.isArray(obj)) {
                    obj.attach = function (newObj) {
                        return operations.attachIterator(newObj,lvl1,lvl2);
                    }
                } else {
                    Object.defineProperty(obj, "attach", {
                        value: function (newObj) {
                            return operations.attachIterator(newObj,lvl1,lvl2);
                        }
                    });
                }
            },
            initialize: function () {
                return $q(function (resolve) {
                    service._memory.indexedObj = operations.deepen(readFrom);
                    service._memory.array = Object.keys(service._memory.indexedObj).map(i => service._memory.indexedObj[i]);
                    resolve(true);
                })
            }
        };
        service.connect = function (location) {
            return $q(function (resolve, reject) {
                if (typeof service._memory.database !== 'undefined' && location === service._memory.database) {
                    resolve('loaded');
                } else {
                    $http.get(location).then(function (db) {
                        service._memory.database = location;

                        readFrom = db.data;
                        operations.initialize().then(function () {
                            resolve(service);
                        });
                    }, function (error) {
                        reject(error);
                    })
                }
            });
        };
        service.put = function (obj) {
            return $q(function (resolve, reject) {
                if (typeof obj._nId === 'undefined') {
                    obj._nId = operations.uuid();
                }
                let newObj = {};
                newObj[obj._nId] = obj;
                readFrom.push(newObj);
                operations.initialize().then(function () {
                    resolve(service.query(obj._nId));
                })
            })
        };
        service.delete = function (_nId) {
            return $q(function (resolve, reject) {
                const handle=[];
                angular.forEach(readFrom,function(all){
                    if(_nId !== Object.keys(all)[0]){
                        handle.push(all);
                    }
                });
                readFrom = handle;
                operations.initialize().then(function () {
                    resolve(true);
                })
            })
        };
        service.writeDump = function(){
            return readFrom;
        };
        service.query = function (query) {
            let answer = false;
            switch (typeof query) {
                case 'string':
                    answer = service._memory.indexedObj[query];
                    break;
                case 'object':
                    answer = $filter('filter')(service._memory.array, query);
                    break;
            }
            return answer;
        };
        return service;
    }]);
