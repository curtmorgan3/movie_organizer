const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const chalk = require('chalk')


// const moviesStorePath = "C:/Users/Curt/Documents/apps/movie_organizer/movies/";
// const genresPath = 'C:/Users/Curt/Documents/apps/movie_organizer/genres/';

const moviesStorePath = "E:/Movies/Action & Adventure/";
const genresPath = "C:/Users/Curt/Desktop/movies/"


const searchMovieGenre = async (movieTitle) => {
	let movieQueryString = movieTitle.replace(' ', '+');
	let extensions = ['.avi', '.mp4', '.m4v', '.wmv', '.mkv', '.flv', '.mov', '720p', '1080p', '.vsmeta'];
	extensions.forEach(type => {
		if(movieQueryString.includes(type)){
			movieQueryString = movieQueryString.replace(type, '');
			movieTitle = movieTitle.replace(type, '');
		}
	});

	const url = `https://www.imdb.com/find?ref_=nv_sr_fn&q=${movieQueryString}&s=all`

  try {
    const response = await axios.get(url);
    let $ = cheerio.load(response.data);

		let firstResult = $('td[class=result_text]').html();
		if(!firstResult){
			console.log(chalk.white.bgRed(`Cannot find genre for ${movieTitle}`))
			return null;
		}
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
		if(genres !== null){
			console.log(title + ': ' + genres);
			genres.forEach(genre => {
				let dirName = genre.toLowerCase().replace(' ', '');
				try{
					fs.accessSync(`${genresPath}${dirName}`);
					try{
						fs.symlinkSync(`${moviesStorePath}${title}`, `${genresPath}${dirName}/${title}`);
						console.log(chalk.green(`Adding ${title} to ${dirName} directory...`));
					}catch (err){
						console.log(chalk.white.bgRed(`${title} is already present in ${dirName} directory.`));
					}
				}catch(err){
					console.log(chalk.red(`${dirName} directory doesn't exist. Creating...`));
					fs.mkdirSync(`${genresPath}${dirName}`, error => console.log(error));
					console.log(chalk.green(`Adding ${title} to ${dirName} directory...`));
					try{
						fs.symlinkSync(`${moviesStorePath}${title}`, `${genresPath}${dirName}/${title}`);
					}catch (err){
						console.log(chalk.white.bgRed(err));
					}
				}
			})
		}
	});
}

init();
