'user strict';
import { query } from './db';

//Task object constructor
class Task {
    constructor(task) {
        this.task = task.task;
        this.status = task.status;
        this.created_at = new Date();
    }
    static createTask(newTask, result) {
        query("INSERT INTO tasks set ?", newTask, function (err, res) {

            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                console.log(res.insertId);
                result(null, res.insertId);
            }
        });
    }
    static getTaskById(taskId, result) {
        query("Select task from tasks where id = ? ", taskId, function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                result(null, res);

            }
        });
    }
    static getAllTask(result) {
        query("Select * from tasks", function (err, res) {

            if (err) {
                console.log("error: ", err);
                result(null, err);
            }
            else {
                console.log('tasks : ', res);

                result(null, res);
            }
        });
    }
    static updateById(id, task, result) {
        query("UPDATE tasks SET task = ? WHERE id = ?", [task.task, id], function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(null, err);
            }
            else {
                result(null, res);
            }
        });
    }
    static remove(id, result) {
        query("DELETE FROM tasks WHERE id = ?", [id], function (err, res) {

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

export default Task;