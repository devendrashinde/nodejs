'user strict';
var sql = require('./db');

//Users object constructor
var Users = function(user){
	if(!user.id) {
		this.id = uuid.v4();
	}
    this.username = user.username;
    this.password = user.password;
};

Users.createUsers = function (newUsers, result) {
        sql.query("INSERT INTO users SET ? ON DUPLICATE KEY UPDATE password = ?", [newUsers.password, newUsers], function (err, res) {
                				
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    console.log(res[1].insertId);
                    result(null, res[1].insertId);
                }
            });
};

Users.getUser = function (userName, result) {
		userName = 
        sql.query("SELECT * FROM users WHERE LOWER(username) = ?", userName, function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res);
              
                }
            });
};

Users.updatePassword = function(userDetails, result){
  sql.query("UPDATE users SET password = ? WHERE username = ?", [userDetails.password, userDetails.username], function (err, res) {
          if(err) {
              console.log("error: ", err);
              result(null, err);
           }
           else{   
             result(null, res.affectedRows);
           }
        }); 
};
Users.remove = function(userName, result){
     sql.query("DELETE FROM users WHERE username = ?", userName, function (err, res) {

                if(err) {
                    console.log("error: ", err);
                    result(null, err);
                }
                else{
               
                 result(null, res);
                }
            }); 
};

module.exports= Users;
