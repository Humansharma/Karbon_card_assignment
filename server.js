const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors')

const app = express();
app.use(cors());
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/scrape', scrape);

app.use(express.static('public'));
//Account pass to login 
const pass="Madgenius.12@"

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Index.html'));
  });

app.get('/scraped_data.csv', (req, res) => {
    res.download('scraped_data.csv');
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

async function scrape(req, res) {
  try {
    const { companyNames } = req.body;

    const browser = await puppeteer.launch({
      headless: false
    });
    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation({waitUntil: "domcontentloaded"});

    const scrapedData = [{ companyName: "companyName", website: "website", linkedInUrl: "linkedInUrl", contactInfo: "contactInfo"}];

    await page.goto(`https://www.linkedin.com/login`);
    await page.type('#username', "humansharmaindia@gmail.com")
    await page.type('#password', pass)
    await page.click('.login__form_action_container button')
    await page.waitForNavigation({waitUntil: "domcontentloaded"})

    console.log("Logged In Successfully");

    // traverse each company by for loop
    for (let companyName of companyNames) {
     
      let response = await page.goto(`https://www.linkedin.com/search/results/companies/?keywords=${companyName}`);
      await navigationPromise;

      // const textContent = await page.$$eval('.reusable-search__entity-result-list', 
      // (elements) => elements.map((element) => element.textContent))

     
      await page.waitForSelector('.reusable-search__entity-result-list');

     
      await page.click('.reusable-search__result-container');

      
      await page.waitForSelector('.org-top-card');

      // to fetch all required data
      const companyInfo = await page.evaluate(() => {
        const companyName =  document.querySelector('.org-top-card-summary__title')?document.querySelector('.org-top-card-summary__title').innerText.trim():"Not Known";
        const website = document.querySelector('.org-top-card-primary-actions__inner a')? document.querySelector('.org-top-card-primary-actions__inner a').href: "undefined";
        const linkedInUrl = window.location?window.location.href:"page not found";
        const contactInfo = document.querySelector('.org-top-card-summary-info-list__info-item')?document.querySelector('.org-top-card-summary-info-list__info-item').innerText.trim():"Not found";
       // const ceoNameElement = document.querySelector('.org-top-card-summary-info-list__info-item span');
       // const ceoTitleElement = document.querySelector('.org-top-card-summary-info-list__info-item span');

       // const ceoName = ceoNameElement ? ceoNameElement.innerText.trim() : 'N/A';
        //const ceoTitle = ceoTitleElement ? ceoTitleElement.innerText.trim() : 'N/A';

      
        return { companyName, website, linkedInUrl, contactInfo};
       // return {companyName}
      });
    //   console.log(companyInfo);
      scrapedData.push(companyInfo);
    }

    await browser.close();

    // // csv file
    let csvData = scrapedData.map(company => `${company.companyName},${company.website},${company.linkedInUrl},${company.contactInfo}`).join('\n');
    // csvData = `companyname,website,LinkedIn,CompanyInfo`
    // const Column= ['companyname', 'website', 'LinkedIn', 'CompanyInfo'];
   
    const fileName = 'scraped_data.csv';
    // fs.writeFileSync(fileName, Column);
    fs.writeFileSync(fileName, csvData);

    
    res.setHeader('Content-Disposition', 'attachment', filename=`${fileName}`);
    res.setHeader('Content-Type', 'text/csv');

    
    res.sendFile(fileName, { root: __dirname });
    console.log(__dirname)

    
    // fs.unlinkSync(fileName);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ success: false, error: 'Internal server error' });
  }

  res.sendFile(path.join(__dirname, 'scraped_data.csv'));
  //scrapedData
}
