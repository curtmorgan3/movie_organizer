const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const chalk = require('chalk')


const moviesStorePath = '/Users/curtmorgan/documents/apps/_side_work/movie_organizer/movies/';
const genresPath = '/Users/curtmorgan/documents/apps/_side_work/movie_organizer/genres/';


const searchMovieGenre = async (movieTitle) => {
	let movieQueryString = movieTitle.replace(' ', '+');
	const url = `https://www.imdb.com/find?ref_=nv_sr_fn&q=${movieQueryString}&s=all`

  try {
    const response = await axios.get(url);
    let $ = cheerio.load(response.data);

		let firstResult = $('td[class=result_text]').html();
		firstResult = firstResult.split("\"");
		let moviePath = firstResult[1];

		const newResponse = await axios.get(`https://www.imdb.com${moviePath}`);
		$ = cheerio.load(newResponse.data);

		let container = $('div[class="see-more inline canwrap"]').last().html();
		$ = cheerio.load(container);
		let genres = [];
		let genresEl = $('a');
		genresEl.map((i, el)=>{
			genres.push($(el).text());
		});
		console.log(chalk.yellow.bgBlue(`\n Looking for ${movieTitle} genres...\n`));
		return genres;


  } catch (error) {
    console.error(error)
  }
}

const init = async () => {
	// Blocking
	fs.readdirSync(moviesStorePath).map( async title => {
		let genres = await searchMovieGenre(title);
		console.log(title + ': ' + genres);
		genres.forEach(genre => {
			let dirName = genre.toLowerCase().replace(' ', '');
			try{
				fs.accessSync(`${genresPath}${dirName}`);
				console.log(`Adding ${title} to ${dirName} directory...`);
				fs.symlinkSync(`${moviesStorePath}${title}`, `${genresPath}${dirName}/${title}`);
			}catch(err){
				console.log(`${dirName} directory doesn't exist. Creating...`);
				fs.mkdirSync(`${genresPath}${dirName}`, error => console.log(error));
				console.log(`Adding ${title} to ${dirName} directory...`);
				fs.symlinkSync(`${moviesStorePath}${title}`, `${genresPath}${dirName}/${title}`);
			}
		})
	});

	//Non-Blocking
	// fs.readdir(moviesDir, (err, files) => {
	// 	files.map(async movie => {
	// 		let genres = await searchMovieGenre(movie);
	// 		console.log(movie + ': ' + genres);
	// 		genres.forEach(genre => {
	// 			let fileName = genre.toLowerCase().replace(' ', '');
	// 			fs.access(`${genresDir}/${fileName}`, error => {
  //   			if (!error) {
  //       	console.log(`genre ${fileName} exists`);
  //   			} else {
	// 				console.log(`genre ${fileName} doesn't exist`);
	// 				fs.mkdir(`${genresDir}/${fileName}`, err => console.error(err));
  //   			}
	// 			});
	// 		})
	// 	});
	// });
}

init();
