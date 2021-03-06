const express = require('express');
const app = express();
const { v4 : uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const mongodb = require('mongodb');
const res = require('express/lib/response');

require('dotenv').config();
const URL = process.env.MONGO_URI;
mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(express.json());


const { Schema } = mongoose;

const todoSchema = new Schema({
    id: String,
    title: String,
    done: false,
    deadline: String,
    created_at: String
})

const userSchema = new Schema({
    id: String,
    name: String,
    username: String,
    todos: [todoSchema]
})

const ToDos = mongoose.model('Todos', todoSchema);
const ToDoUser = mongoose.model('ToDoUser', userSchema);

//middleware para checar se o user existe
async function checkUser(req, res, next) {
    const { username } = req.headers;

    const userFind = await ToDoUser.exists({username: username})
    console.log(userFind)
    if(userFind === false) {
        console.log(username)
        res.json({error: "User DO NOT exists !"})
    } else {
        req.username = username
        return next()
    }
}
//middleware para evitar user duplicado
async function checkUserAlready(req, res, next) {
    const { username } = req.body;

    const userFind = await ToDoUser.exists({username: username})
    console.log(userFind)
    if(userFind === true) {
        console.log(username)
        res.json({error: "User ALREADY EXISTS !"})
    } else {
        req.username = username
        return next()
    }
}

//lisa todos os users
app.get("/", (req, res)=>{
    ToDoUser.find({}, (error, data) =>{
        if(!error){
            res.json(data)
        }
    });
    
})

//cria novo user
app.post("/user", checkUserAlready, (req, res) => {
    
    const user = new ToDoUser({    
        id: uuidv4(),
        name: req.body.name,
        username: req.body.username
    })

    user.save();
    console.log(user)
    res.status(201).json(user)   
})
//lista ToDos de um username
app.get("/todos", checkUser, (req, res) => {
    const { username } = req;
    
    ToDoUser.findOne({username: username}, (erro, dados) => {
        if (!erro) {            
            res.json(dados.todos)
        }
    })
}
 
)
//cria novo ToDo para um username
app.post("/todos", checkUser, (req, res) => {
    const { title, deadline } = req.body;
    const { username } = req.headers;

    const newT = new ToDos({
        id: uuidv4(),
        title: title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date()
        })

    ToDoUser.findOne({username: username}, (error, action)=>{
        if(!error){
            action.todos.push(newT)
            action.save()
            res.json(action)
        }
    })
})

//altera title e deadline de uma ToDo
app.put("/todos/:id", checkUser, (req, res) => {
    const { title, deadline } = req.body;
    const { username } = req.headers;
    const { id } = req.params;

    ToDoUser.findOne({username: username}, (error, action)=>{
        if(!error){
            action.todos.filter(
                selected => {
                    if(selected.id === id){
                        selected.title = title
                        selected.deadline = deadline
                    }
                })
            action.save()
            res.json(action.todos)
        }
    })    
})

//marcar ToDo selecionado como done
app.patch("/todos/:id/done", checkUser, (req, res)=>{
    const { username } = req.headers;
    const { id } = req.params;

    ToDoUser.findOne({username: username}, (error, action)=>{
        if(!error){
            action.todos.filter(
                selected => {
                    if(selected.id === id){
                        selected.done = true;                        
                    }
                })
            action.save()
            res.json(action)
        }
    })

})

//deletar ToDo selecionado
app.delete("/todos/:id", checkUser, (req, res)=>{
    const { username } = req.headers;
    const { id } = req.params;

    ToDoUser.findOne({username: username}, (error, action)=>{
        if(!error){
            action.todos.filter(
                selected => {
                    if(selected.id === id){
                        const toDel = action.todos.indexOf(selected)
                        action.todos.splice(toDel, 1)
                        action.save()
                    }
                })
            // action.save()
            res.json(action)
        }
    })

})











app.listen(3030, ()=> {console.log("Servidor ATIVO !")});
