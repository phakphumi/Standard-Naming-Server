var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  port: "8889",
  user: "root",
  password: "root"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to mysql.");
});

var login = function(user, pin) {
    return new Promise(function(resolve, reject) {
        con.query(`SELECT user, type, name
                    FROM standard_naming.login
                    WHERE user = '${user}'
                        AND pin = '${pin}'`
        , function(err, result, fields) {
            if(err) reject(err);

            if(result) {
                resolve({
                    success: true,
                    msg: result[0]
                });
            } else {
                resolve(JSON.stringify({
                    success: false
                }));
            }
        })
    });
}

var calculateStandardDefine = function(priority) {
    return new Promise(function(resolve, reject) {
        if(!priority) {
            reject('There\'s a problem while calculating');
        } else if (priority === 1 || priority === 2) {
            resolve('YES');
        } else {
            resolve('NO');
        }
    });
}

var calculatePhysicalLength = function(physical, combine) {
    return new Promise(function(resolve, reject) {
        if(!physical) {
            reject('There\'s a problem while calculating');
        } else {
            if(combine) {
                resolve(physical.length);
            } else {
                Promise.all(
                    physical.map(function(word, index){
                        return new Promise(function(resolve, reject) {
                            if(index !== 0) {
                                resolve(word.value.length + 1);
                            } else {
                                resolve(word.value.length);
                            }
                        });
                    })
                )
                .then(function(res){
                    const sum = res.reduce(function(a, b) {
                        return a+b;
                    });

                    return sum;
                })
                .then(function(sum){
                    resolve (sum);
                });
            }
        }
    });
}

var approveRequest = function(params) {
    return new Promise(function(resolve, reject) {
        if(params.request_type === 'insert') {
            con.query(`INSERT INTO standard_naming.define_name(logical, physical, business, priority, request_by, approve_by, date_create, date_request)
            SELECT logical, new_physical, new_business, new_priority, request_by, 'admin', NOW(), request_date
            FROM standard_naming.request_list
            WHERE id = '${params.id}'`
            , function(err, result, fields) {
                if (err) reject(err);

                if(result) {
                    declineRequest(params.id).then(function(){
                        resolve(JSON.stringify({
                            success: true,
                            msg: 'Success on Insert'
                        }));
                    });
                }
            });
        } else if(params.request_type === 'update') {
            con.query(`UPDATE standard_naming.define_name t1 
                        JOIN standard_naming.request_list t2
                            ON t1.logical = t2.logical
                            AND t2.id = '${params.id}' 
                        SET t1.logical = t2.logical,
                            t1.physical = t2.new_physical,
                            t1.business = t2.new_business,
                            t1.priority = t2.new_priority,
                            t1.request_by = t2.request_by,
                            t1.approve_by = 'admin',
                            t1.date_request = t2.request_date`
            , function(err, result, fields) {
                if (err) reject(err);

                if(result) {
                    declineRequest(params.id).then(function() {
                        resolve(JSON.stringify({
                            success: true,
                            msg: 'Success on Update'
                        }));
                    });
                }
            });
        } else if(params.request_type === 'delete') {
            con.query(`DELETE FROM standard_naming.define_name
                        WHERE logical in (
                            SELECT logical
                            FROM standard_naming.request_list
                            WHERE id = '${params.id}')`
            , function(err, result, fields) {
                if (err) reject(err);

                if(result) {
                    declineRequest(params.id).then(function() {
                        resolve(JSON.stringify({
                            success: true,
                            msg: 'Success on Delete'
                        }));
                    });
                }
            });
        }
        resolve();
    });
}

var declineRequest = function(request_id) {
    return new Promise(function(resolve, reject) {
        con.query(`DELETE FROM standard_naming.request_list
                    WHERE id='${request_id}'`
            , function(err, result, fields) {
            if(err) reject(err);

            if(result) {
                resolve(JSON.stringify({
                    success: true,
                    msg: 'Already decline request'
                }));
            }
        });
    });
}

var requestInsert = function(params) {
    return new Promise(function(resolve, reject) {
        const priority = params.logical.trim().split(' ').length > 1 ? 2 : 3;
        
        con.query(`INSERT INTO standard_naming.request_list(request_type, logical, new_physical, new_business, new_priority, request_by)
                    VALUES('insert','${params.logical}', '${params.new_physical}', '${params.new_business}', '${priority}', '${params.request_by}')`
        , function(err, result, fields) {
            if (err) reject(err);

            if(result) {
                resolve(JSON.stringify({
                    success: true,
                    msg: 'Success on Insert'
                }));
            }
        });
    });
}

var requestUpdate = function(params) {
    return new Promise(function(resolve, reject) {
        const priority = params.logical.trim().split(' ').length > 1 ? 2 : 3;

        con.query(`INSERT INTO standard_naming.request_list(request_type, logical, old_physical, old_business, old_priority, new_physical, new_business, new_priority, request_by)
                    VALUES('update','${params.logical}', '${params.old_physical}', '${params.old_business}', '${params.old_priority}', '${params.new_physical}', '${params.new_business}', '${priority}', '${params.request_by}')`
        , function(err, result, fields) {
            if (err) reject(err);

            if(result) {
                resolve(JSON.stringify({
                    success: true,
                    msg: 'Success on Update'
                }));
            }
        });
    });
}

var requestDelete = function(params) {
    return new Promise(function(resolve, reject) {
        con.query(`INSERT INTO standard_naming.request_list(request_type, logical, old_physical, old_business, old_priority, request_by)
                    VALUES('delete','${params.logical}', '${params.old_physical}', '${params.old_business}', '${params.old_priority}', '${params.request_by}')`
        , function(err, result, fields) {
            if (err) reject(err);

            if(result) {
                resolve(JSON.stringify({
                    success: true,
                    msg: 'Success on Delete'
                }));
            }
        });
    });
}

var fetchRequest = function() {
    return new Promise(function(resolve, reject) {
        con.query(
                `SELECT id, request_type, logical, old_physical, new_physical, old_business, new_business, old_priority as old_type, new_priority as new_type, request_by, date_format(request_date, '%Y-%m-%d') as request_date
                    FROM standard_naming.request_list`
        , function(err, result, fields) {
            if (err) reject(err);
            
            if(result.length !== 0) {
                resolve(JSON.stringify({
                    success: true,
                    msg: result
                }));
            } else {
                reject('There\'s no data');
            }
        });
    });
}

var fetchData = function() {
    return new Promise(function(resolve, reject) {
        con.query(
                `SELECT logical, physical, coalesce(business,'-') AS business, priority AS type, date_format(date_create, '%Y-%m-%d') as created, date_format(date_update, '%Y-%m-%d') as updated, approve_by as approved
                    FROM standard_naming.define_name`
        , function(err, result, fields) {
            if (err) reject(err);
            
            if(result.length !== 0) {
                resolve(JSON.stringify({
                    success: true,
                    msg: result
                }));
            } else {
                reject('There\'s no data');
            }
        });
    });
}

var matchLogical = function(logical) {
    return new Promise(function(resolve, reject) {
        con.query(`SELECT physical, business, priority 
                    FROM standard_naming.define_name 
                    WHERE logical = '${logical}'
                        AND priority IN ('1', '2')`
                    , function (err, result, fields) {
            if (err) reject(err);    

            if(result.length !== 0) {
                Promise.all([
                    calculateStandardDefine(result[0].priority),
                    calculatePhysicalLength(result[0].physical, true)
                ]).then(function(res) {
                    result[0].physical = [{
                        value: result[0].physical, 
                        define: true
                    }];
                    result[0].standardDefine = res[0];
                    result[0].physicalLength = res[1];

                    delete result[0].priority;
                }).then(function() {
                    resolve(JSON.stringify({
                        success: true,
                        msg: result[0]
                        })
                    );
                })
            } else {
                const words = logical.split(/[ _]+/);
                var standardDefine = 'YES';

                var physical = words.map(function(word) {
                    return new Promise(function(resolve, reject) {
                        con.query(`SELECT physical 
                                    FROM standard_naming.define_name 
                                    WHERE logical = '${word}'
                                        AND priority IN ('3')`
                            , function (err, result, fields) {
                            if (err) reject(err);    
                        
                            if(result.length !== 0) {
                                resolve({
                                    value: result[0].physical, 
                                    define: true
                                });
                            } else {
                                standardDefine = 'NO';
                                resolve({
                                    value: word.toUpperCase(), 
                                    define: false
                                });
                            }
                        });    
                    });
                });

                Promise.all(physical).then(function(res) {
                    var result = {};

                    result.physical = res;
                    result.business = '';
                    result.standardDefine = standardDefine;

                    return result
                }).then(function(result){
                    calculatePhysicalLength(result.physical, false).then(function(length) {
                        result.physicalLength = length;

                        return result;
                    })
                    .then(function(res){
                        resolve(JSON.stringify({
                            success: true,
                            msg: res
                            })
                        );
                    });
                });
            }
        });
    });
}

module.exports = {
    approveRequest: approveRequest,
    declineRequest: declineRequest,
    requestInsert: requestInsert,
    requestUpdate: requestUpdate,
    requestDelete: requestDelete,
    fetchRequest: fetchRequest,
    fetchData: fetchData,
    matchLogical: matchLogical,
    login: login
}