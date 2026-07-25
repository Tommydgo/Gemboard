import path from 'path'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth/auth'
import userRoutes from './routes/user/user'
import todoRoutes from './routes/todos/todos'
import boardRoutes from './routes/boards/boards'
import listsRoutes from './routes/lists/lists'
import notFound from './middleware/notFound'

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')))
app.use('/', authRoutes)
app.use('/', userRoutes)
app.use('/', todoRoutes)
app.use('/', boardRoutes)
app.use('/', listsRoutes)
app.get('/', (req, res) => {
    res.redirect('/login.html');
});
app.use(notFound)

if (process.env.PORT)
    app.listen(process.env.PORT)
else {
    console.log("No port given.")
    process.exit(84)
}

export { app }
