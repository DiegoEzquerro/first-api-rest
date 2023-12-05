const express = require('express');
const crypto = require('node:crypto');
const cors = require('cors');
const movies = require('./movies.json');
const { validateMovie, validatePartialMovie } = require('./schemas/movies,js');

const app = express();
app.use(express.json()); // middleware para parsear el body; para que funcione el req.body
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'https://movies.com',
      'https://midu.dev'
    ];

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    if (!origin) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }
}));
app.disable('x-powered-by');

// const ACCEPTED_ORIGINS = [
//   'http://localhost:8080',
//   'http://localhost:1234',
//   'http://localhost:3000',
//   'http://movies.com'
// ];

// todos los recursos que sean movies se identifican con /movies
app.get('/movies', (req, res) => {
  // res.header('Access-Control-Allow-Origin', '*');
  // res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
  // const origin = req.headers.origin;
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', origin);
  // }

  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter(m => m.genre.some(g => g.toLocaleLowerCase() === genre.toLocaleLowerCase()));
    return res.json(filteredMovies);
  }
  res.json(movies);
});

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params;
  const movieIndex = movies.findIndex(m => m.id !== id);

  if (movieIndex === -1) {
    return res.status(404).json({
      message: 'Movie not found'
    });
  }

  movies.splice(movieIndex, 1);

  return res.json({
    message: 'Movie deleted'
  });
});

app.get('/movies/:id', (req, res) => { // path-to-regexp: segmento dinámico
  // const id = req.params.id;
  const { id } = req.params;
  const movie = movies.find(m => m.id === id);
  if (movie) {
    res.json(movie);
  }

  res.status(404).json({
    message: 'Movie not found'
  });
});

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body);

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) }); // o 422 unprocessable entity
  }

  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  };

  // esto no es REST porque estamos guardadon el estado de la aplicación en memoria
  movies.push(newMovie);

  res.status(201).json(newMovie); // para actualizar el estado de la aplicación
});

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body);

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) }); // o 422 unprocessable entity
  }

  const { id } = req.params;
  const movieIndex = movies.findIndex(m => m.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({
      message: 'Movie not found'
    });
  }

  // solo lo que se valide se podrá actualizar, por ejemplo la ID no se podrá actualizar
  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  };

  movies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

// app.options('/movies/:id', (req, res) => {
//   const origin = req.headers.origin;
//   if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
//     res.header('Access-Control-Allow-Origin', origin);
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
//   }
//   res.sendStatus(200);
// });

const PORT = process.env.PORT ?? 1234;
app.listen(PORT, () => {
  console.info(`server listening on port http://localhost:${PORT}`);
});
