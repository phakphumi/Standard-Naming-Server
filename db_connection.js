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

module.exports = {
    matchLogical: function(logical) {
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

}