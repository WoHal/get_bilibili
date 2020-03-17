const { spawn, exec } = require('child_process');
const fs = require('fs');
const mkdirp = require('mkdirp');
const commander = require('commander');
const program = new commander.Command();

program.version('0.0.1');

function myParseInt(value) {
    return parseInt(value, 10);
}

program
    .requiredOption('-u, --url <url>', 'set bilibili url')
    .option('-d, --dir <dir>', 'Set output directory', process.cwd())
    .option('-s, --start <num>', 'Set start of eposide', myParseInt, 1)
    .option('-e, --end <num>', 'Set end of eposide', myParseInt, 1)
    .option('-o, --output <filename>', 'Set output filename')
    .option('-C, --nocaption', 'Don\'t download subtitle')
    .option('-S, --select <items>', 'Select some eposides', value => value.split(/,|\s+/), []);

program.parse(process.argv);

if (program.end < program.start) {
    program.end = program.start;
}

function download(url, dir, filename) {
    return new Promise((resolve) => {
        const params = [];
        filename && params.push.apply(params, ['-O', filename]);
        program.nocaption && params.push('--no-caption');
        params.push.apply(params, ['--debug', '-o', dir, url]);

        console.log('Downloading you-get ' + params.join(' '));

        const you_get = spawn('you-get', params);
        you_get.stdout.setEncoding('utf8');
        you_get.stdout.on('data', console.log);
        you_get.stderr.setEncoding('utf8');
        you_get.stderr.on('data', console.error);
        you_get.on('close', resolve);
    });
}

function getEposideInfo(url) {
    return new Promise((resolve, reject) => {
        exec(`you-get ${url} --json`, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            }
            try {
                const info = JSON.parse(stdout);
                resolve(info);
            } catch(e) {
                reject(e);
            }
        });
    });
}

function getDownloadUrl(url, eposide = 1) {
    if (!url) {
        throw Error('Url cannot be empty');
    }
    return `${url}?p=${eposide}`;
}

async function run({
    start,
    end,
    url,
    dir,
    select,
    output
}) {
    let eposides = select.length > 0 ? select : Array(end - start + 1).fill(start).map((item, index) => item + index);
    try {
        if (dir !== process.cwd()) {
            await mkdirp(dir);
        }
    } catch(e) {
        throw Error(e);
    }

    for (let eposide of eposides) {
        try {
            let filename;
            if (output) {
                filename = `P${eposide}. ${output}`;
            }
            const downloadUrl = getDownloadUrl(url, eposide);
            if (!filename) {
                const eposideInfo = await getEposideInfo(downloadUrl);
                filename = eposideInfo.title;
            }

            await download(downloadUrl, dir, filename);
        } catch (e) {
            throw Error(e);
        }
    }
}

try {
    run(program);
} catch(e) {
    throw Error(e);
}
