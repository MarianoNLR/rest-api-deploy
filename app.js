//REST = arquitectura de software /2000 - ROY FIELDING
//REST = REPRESENTATIONAL STATE TRANSFER
//Principios REST = Escalabilidad, Portabilidad, Fiabilidad, Visibilidad, Simplicidad, Fácil de modificar
//FUNDAMENTOS REST
//Recursos = En rest todo es considerado un recurso, cada recurso se identifica con una URL.
//Verbos HTTP = para definir las operaciones que se pueden realizar con los recursos.
//Representaciones = JSON, XML, HTML, etc. El cliente deberia poder decidir la representacion del recurso.
//Stateless = No debe mantener un estado para decidir que hacer, toda la informacion necesaria debe ir en la request.
//Interfaz uniforme.
//Separación de conceptos = Permite que cliente y servidor evolucionen de forma separada.

const express = require('express')
const movies = require('./movies.json')
const cors = require('cors')
const crypto = require('node:crypto')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()

const ACCEPTED_ORIGINS = [
    'http://localhost:1234/movies',
    'http://localhost:1235',
    'http://localhost:8080/',
    'http://movies.com'
]

app.disable('x-powered-by')

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.json({message: 'Hola Mundo'})
})

//Todos los recursos que sean movies se identifican con /movies
app.get('/movies', (req, res) => {

    const { genre } = req.query

    if (genre) {
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies)
    }
    res.json(movies)
})

app.post('/movies', (req, res) => {
    const result = validateMovie(req.body)
    
    if (result.error) {
        //422 Unprocessable Entity
        return res.status(400).json({
            error: JSON.parse(result.error.message)

        })
    }

    const newMovie = {
        id: crypto.randomUUID(), //uuid v4
        ...result.data
    }

    //Esto no sería REST 
    //porque estamos guardando el estado de la app en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body)
    
    if(!result.success) {
        return res.status(400).json({error: JSON.parse(result.error.message)})
    } 
    
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex == -1) {
        return res.status(404).json({ message: 'Movie not found' })
    }
    
    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie

    return res.json(updateMovie)
    
    
})

//Obtener pelicula por id
app.get('/movies/:id', (req, res) => { //path-to-regexp
    const { id } = req.params;
    const movie = movies.find(movie => movie.id === id)
    if (movie) return res.json(movie)

    res.status(404).json({message : 'Movie not found'})
})

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id == id)

    if (movieIndex === -1) {
        return res.status(404).json({message: 'Movie not found'})
    }

    movies.splice(movieIndex, 1)

    return res.json({message: 'Movie deleted'})
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
})
