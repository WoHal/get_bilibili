const spawn = require('child_process').spawn;
const mkdirp = require('mkdirp');
const commander = require('commander');
const program = new commander.Command();
const fs = require('fs');

program.version('0.0.1');

function myParseInt(value) {
    return parseInt(value, 10);
}

program
    .requiredOption('-l, --url <url>', 'set bilibili url')
    .option('-d, --dir <dir>', 'set output directory', process.cwd())
    .option('-s, --start <num>', 'set start of eposide', myParseInt, 1)
    .option('-e, --end <num>', 'set end of eposide', myParseInt, 1)
    .option('-S, --select <items>', 'select some eposides', value => value.split(/,|\s+/), []);

program.parse(process.argv);

if (program.end < program.start) {
    program.end = program.start;
}

function download(url, dir) {
    return new Promise((resolve, reject) => {
        const you_get = spawn('you-get', ['--debug', '-o', dir, url]);
        you_get.stdout.setEncoding('utf8');
        you_get.stdout.on('data', console.log);
        you_get.stderr.setEncoding('utf8');
        you_get.stderr.on('data', console.error); 
        you_get.on('close', resolve);
    });
}


async function run({start, end, url, dir}) {
    let count = start;
    const MAX_COUNT = end;
    try {
        if (dir !== process.cwd()) {
            await mkdirp(dir);
        }
    } catch(e) {
        throw Error(e);
    }

    while (count <= MAX_COUNT) {
        const download_url = `${url}?p=${count}`;
        try {
            await download(download_url, dir);
        } catch (e) {
            fs.writeFileSync(dir + 'err.txt', download_url + '\n', {
                flag: 'a'
            });
            throw Error(e);
        }
        count = count + 1;
    }
}

try {
    run({
        start: program.start,
        end: program.end,
        url: program.url,
        dir: program.dir
    });
} catch(e) {
    throw Error(e);
}
