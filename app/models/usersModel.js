'user strict';
import { query } from './db';

//Users object constructor
class Users {
    constructor(user) {
        if (!user.id) {
            this.id = uuid.v4();
        }
        this.username = user.username;
        this.password = user.password;
    }
    static createUsers(newUsers, result) {
        query("INSERT INTO users SET ? ON DUPLICATE KEY UPDATE password = ?", [newUsers.password, newUsers], function (err, res) {

            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                console.log(res[1].insertId);
                result(null, res[1].insertId);
            }
        });
    }
    static getUser(userName, result) {
        userName =
            query("SELECT * FROM users WHERE LOWER(username) = ?", userName, function (err, res) {
                if (err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else {
                    result(null, res);

                }
            });
    }
    static updatePassword(userDetails, result) {
        query("UPDATE users SET password = ? WHERE username = ?", [userDetails.password, userDetails.username], function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(null, err);
            }
            else {
                result(null, res.affectedRows);
            }
        });
    }
    static remove(userName, result) {
        query("DELETE FROM users WHERE username = ?", userName, function (err, res) {

            if (err) {
                console.log("error: ", err);
                result(null, err);
            }
            else {

                result(null, res);
            }
        });
    }
}

export default Users;
