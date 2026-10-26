const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const fs = require('fs');
const os = require('os');

const userName = os.userInfo().username;
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

const OUT = `${__dirname}\\capture_slingshot.jsonl`;

let seq = 0;

(async () => {

    const browser = await puppeteer.connect({
        browserWSEndpoint: keys.jsonURL,
        defaultViewport: null,
    });

    const pages = await browser.pages();

    const page = pages.find(p =>
        p.url().includes('192.168.1.8:8082')
    );

    if (!page) {
        console.log('No Slingshot tab found.');
        process.exit(1);
    }

    console.log('');
    console.log('==============================================');
    console.log(' Slingshot Network Capture');
    console.log('==============================================');
    console.log('');
    console.log(`Attached to: ${page.url()}`);
    console.log('');
    console.log('Now navigate to ONE specific work order.');
    console.log('Do it exactly the way your shipping team normally does.');
    console.log('');
    console.log(`Logging to: ${OUT}`);
    console.log('');
    console.log('Press Ctrl+C when finished.');
    console.log('');

    const log = (obj) => {
        fs.appendFileSync(
            OUT,
            JSON.stringify(obj) + '\n'
        );
    };

    // ---------------------------------------------
    // PAGE NAVIGATION
    // ---------------------------------------------

    page.on('framenavigated', frame => {

        if (frame === page.mainFrame()) {

            const url = frame.url();

            const id = ++seq;

            log({
                seq: id,
                t: new Date().toISOString(),
                kind: 'navigation',
                url: url
            });

            console.log('');
            console.log(`NAVIGATION #${id}`);
            console.log(url);
        }
    });

    // ---------------------------------------------
    // REQUESTS
    // ---------------------------------------------

    page.on('request', req => {

        const type = req.resourceType();

        // Ignore static junk.
        if (
            type === 'image' ||
            type === 'stylesheet' ||
            type === 'font' ||
            type === 'media'
        ) {
            return;
        }

        const id = ++seq;

        const record = {
            seq: id,
            t: new Date().toISOString(),
            kind: 'request',
            resourceType: type,
            method: req.method(),
            url: req.url(),
            postData: req.postData() || null
        };

        log(record);

        console.log(
            `#${id} ${req.method()} [${type}] ${req.url()}`
        );

        if (req.postData()) {
            console.log('   POST DATA:', req.postData());
        }
    });

    // ---------------------------------------------
    // RESPONSES
    // ---------------------------------------------

    page.on('response', res => {

        const req = res.request();
        const type = req.resourceType();

        if (
            type === 'image' ||
            type === 'stylesheet' ||
            type === 'font' ||
            type === 'media'
        ) {
            return;
        }

        const id = ++seq;

        log({
            seq: id,
            t: new Date().toISOString(),
            kind: 'response',
            status: res.status(),
            resourceType: type,
            method: req.method(),
            url: res.url(),
            contentType:
                res.headers()['content-type'] || null
        });

        console.log(
            `   <- ${res.status()} ${res.url()}`
        );
    });

    // ---------------------------------------------
    // POPUPS / NEW WINDOWS
    // ---------------------------------------------

    browser.on('targetcreated', target => {

        const url = target.url();

        log({
            seq: ++seq,
            t: new Date().toISOString(),
            kind: 'targetcreated',
            type: target.type(),
            url: url
        });

        console.log('');
        console.log('NEW BROWSER TARGET:');
        console.log(`   ${target.type()} ${url}`);
    });

    // ---------------------------------------------
    // KEEP SCRIPT RUNNING
    // ---------------------------------------------

    await new Promise(() => {});

})();