const COUNTRIES_DETAILS = require('../dictionaries/countries');
const boom = require('@hapi/boom');
const puppeteer = require('puppeteer-core');
const edgeChromium = require('chrome-aws-lambda');
//Creamos la clase que instanciaremos en el archivo courses.js
class PuppeteerService {
  constructor() {
    this.COUNTRIES_DETAILS = COUNTRIES_DETAILS;
  }

  /*Aqui es donde usamos puppeteer para conseguir los datos y almacenarlos en la variable generada en el constructor
  hice el método privado para luego llamarla desde el método find*/

  //Pasamos la url y el nombre de usuario como parámetros
  async #getCountries(url) {
    const executablePath = await edgeChromium.executablePath;
    //Lanzamos el navegador, la opción no sandbox era necesaria para habilitar puppeteer en la app en heroku
    let browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: edgeChromium.args,
      ignoreHTTPSErrors: true,
    });
    let page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-ES,es;q=0.9',
    });

    //Establecemos los user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36'
    );
    //Aquí vamos a la url :), una parte de la url está en una variable de entorno, y la otra es el username es el que le pasamos
    await page.goto(`${url}`);

    //Aquí almacenamos el resultado de la búsqueda de datos en la variable this.courses
    let { countries, songs } = await page.evaluate(() => {
      //Si no hay datos devolvemos undefined
      if (document == undefined) {
        return undefined;
      } else {
        //En caso contrario procesamos los datos, yo necesitaba el título, la imagen del curso y el link al diploma!
        //Elegí esta manera para almacenar los datos, en un array temporal que devuelvo
        let countries = JSON.parse(
          document
            .getElementsByTagName('pre')[0]
            .innerHTML.split('voting_table_main = ')[1]
            .split(';')[0]
        );
        let songs = JSON.parse(
          document
            .getElementsByTagName('pre')[0]
            .innerHTML.split('voting_songs = ')[1]
            .split('};')[0] + '}'
        );
        return { countries, songs };
      }
    });
    //Es importante cerrar el browser al terminar
    await browser.close();
    //Si finalmente no hemos devuelto datos, devolvemos un error con boom diciendo que no hemos encontrado el nombre de usuario
    if (countries == undefined) {
      throw boom.notFound('Usuario no encontrado, revisa el nombre de usuario');
    } else {
      //En caso contrario devolvemos la información!
      let array = [];
      for (const i in countries) {
        array.push({
          name: this.COUNTRIES_DETAILS[i].name,
          link: this.COUNTRIES_DETAILS[i].link,
          code: i,
          song: `${songs[i.toString()][0]} - ${songs[i.toString()][1]}`,
          position: countries[i][1] <= 0 ? countries[i][0] : countries[i][1],
          points: countries[i][2] <= 0 ? 0 : countries[i][2],
        });
      }
      return array;
    }
  }
  //Este es el método público que he usado para acceder al privado
  find(url) {
    return this.#getCountries(url);
  }
}

module.exports = PuppeteerService;
