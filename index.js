const express = require('express');
const app = express();
const { v4 : uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const mongodb = require('mongodb')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(express.json());


const { Schema } = mongoose;

const userSchema = new Schema({
    id: String,
    name: String,
    username: String,
    todos: []
})

const ToDoUser = mongoose.model('ToDoUser', userSchema);

function midCheckUser(req, res, next) {
    const { usuario } = req.headers;
    console.log("MidCheckUser - " + usuario)
    
    const selectedUser = ToDoUser.findOne(
        (pessoa) => pessoa.name = usuario
    )

    if (!selectedUser) {
        return res.status(400).json({erro: "User Not Found !"})
    }
    req.selectedUser = selectedUser;
    return next();
}

app.get("/", (req, res)=>{
  res.json({status: "ON"})
})

app.post("/user", (req, res) => {
    const user = new ToDoUser({    
        id: uuidv4(),
        name: req.body.name,
        username: req.body.username
    })

    user.save();
    console.log(user)
    res.status(201).json(user)   
})

app.get("/todos", (req, res) => {
    const { username } = req.headers;
    
    ToDoUser.findOne({username: username}, (erro, dados) => {
        if (!erro) {            
            res.json(dados.todos)
        }
    })
})

app.post("/todos", (req, res) => {
    const { title, deadline } = req.body;
    const { username } = req.headers;

        ToDoUser.findOne({username: username}, (erro, dados) => {
        if (!erro) {
            const newTodo = { 
                id: uuidv4(),
                title: title,
                done: false, 
                deadline: new Date(deadline), 
                created_at: new Date()
            }            
            dados.todos.push(newTodo)
            res.json(newTodo)
            dados.save()
        }
    })
})

app.put("/todos/:id", (req, res) => {
    const { title, deadline } = req.body;
    const { username } = req.headers;
    const { id } = req.params;

    ToDoUser.findOne({username: username}, (erro, dados) => {
        if (!erro) {
            // res.json(dados.todos)
            dados.todos.findOne({id: id}, (erro, dadosTodo)=> {
                if(!erro){
                    res.json(dadosTodo)
                }
            })
        }
    })



    //     ToDoUser.findOne({id: id}, (erro, dados) => {
    //     if (!erro) {
    //         res.json(dados)
    //         // dados.save()
    //     }
    // })

    // res.send("funcionando PUT" + id)


})
app.listen(3030);
