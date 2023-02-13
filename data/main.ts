import puppeteer from 'puppeteer';
import { createArrayCsvWriter } from 'csv-writer'

const baseUrl = 'https://ebookjapan.yahoo.co.jp/search/?genre=mens'
const urls = [baseUrl];
// for (let i = 2; i < 10; i++) {
//     const url = baseUrl + `&page=${i}`
//     urls.push(url)
// }

const crawl = async (url: string) => {

    // ファイル名用の現在日付作成
    const now = (() => {
        const d = new Date();
        return `${d.getFullYear()}_${(d.getMonth() + 1)}_${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
    })();

    // ブラウザー開く
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        defaultViewport: {
            width: 1280,
            height: 800
        }
    });

    // 新規タブ
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(0);

    //  URLへアクセス
    await page.goto(url);

    // // ScreenShot保存
    // const imgPath = path.join('./ss', `${now}.png`);
    // await page.screenshot({
    //     path: imgPath,
    //     fullPage: true,
    // });

    // ドキュメントの情報を取得

    // const content = await page.$$('p.book-caption__title');

    // var datas = [];
    // for (let v of content) {
    //     datas.push(await (await v.getProperty('textContent')).jsonValue())
    // }

    const content = await page.$$('div.book-item__caption')

    var data = []
    for (let v of content) {
        var arr: (string | number)[] = []
        const titleEl = await v.$('p.book-caption__title')
        const title = await (await titleEl?.getProperty('textContent'))?.jsonValue()

        const authorEl = await v.$('p.book-caption__author')
        const author = await (await authorEl?.getProperty('textContent'))?.jsonValue()

        if (!title || !author) continue

        const titleArr = title.split(' ')
        const numStr = titleArr[titleArr.length - 1]
        const num = parseInt(numStr.replace("冊", ''))

        const titleStr = title.replace(numStr, '')

        arr.push(titleStr.trim())
        arr.push(num)

        const authorStr = author.replace("\n", "")
        arr.push(authorStr.trim())
        data.push(arr)
    }

    // セッション終了
    await browser.close();

    return data
};

const handleCrawler = async () => {
    const r = [];
    for (let v of urls) {
        r.push(await crawl(v));
    }

    const time = Date.now().toString()

    const csvWriter = createArrayCsvWriter({
        header: ['title', 'number', 'author'],
        path: `csv/${time}.csv`
    });

    await csvWriter.writeRecords(r[0])
};

(async () => {
    handleCrawler();
})();

