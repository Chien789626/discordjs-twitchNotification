const fs = require('fs');
const csvdb = require('csv-database');
const csv = require('csvtojson');
const dateFormat = require('dateformat');
const config = require('./config.json');

//csvバックアップ
function backupCsv () {
    try {
        console.log("バックアップ開始");
        let nowDt = dateFormat(new Date(), "yyyymmdd_HHMMss");
        let bkFile = fs.readFileSync("./db/streamerList.csv", 'utf-8',);
        fs.writeFileSync(`./db/streamerList_bk_${nowDt}.csv`, bkFile);
        console.log("バックアップ正常終了");
    } catch (err) {
        console.log(err);
    }
}


//配信者リスト表示
function runnerList() {
    let text = fs.readFileSync('./db/streamerList.csv', 'utf-8');
    let list = [];
    return new Promise((resolve) => {
    csv({
        noheader: false,
        output: "csv"
    })
        .fromString(text)
        .then((csvRow) => {
            for (let i = 0; i < csvRow.length; i++) {
                list[i] = csvRow[i].slice(1, 2);
            }
            resolve(list);
        });
    });
}


//配信者リストへ追加
function addRunner(user_id) {
    return new Promise((resolve) => {
        isUserId(user_id).then(result => {
            if (result == 'not exists') {
                addDB(user_id);
                resolve('not exists');
            } else {
                resolve('exists');
            }
        });
    });
}

//配信者リストから削除
function delRunner(user_id) {
    return new Promise((resolve) => {
        isUserId(user_id).then(result => {
            console.log('1:' + result);
            if (result == 'exists') {
                delDB(user_id);
                resolve('exists');
            } else {
                resolve('not exists');
            }
        });
    });

}

//配信者登録確認
function isUserId(user_id) {
    return new Promise((resolve) => {
        let csvstr = fs.readFileSync(config.csvFilePath, 'utf-8');
        csv()
            .fromString(csvstr)
            .then((jsonObj) => {
                for (let i = 0; i < jsonObj.length; i++) {
                    if (jsonObj[i].user_name == user_id) {
                        resolve('exists');
                        return;
                    }
                }
                resolve('not exists');
                return;
            });
    })
}

//DB登録処理
async function addDB(user_id) {
    var db = await csvdb(config.csvFilePath, ["id", "user_name", "status"], ",");
    var list = await db.get();
    try {
        await db.add({ id: list.length + 1, user_name: user_id, status: 0 });
    } catch (err) {
        console.log(err);
    }
}

//DB削除処理
async function delDB(user_id) {
    try {
        var db = await csvdb(config.csvFilePath, ["id", "user_name", "status"], ",");
        var getData = await db.get({ user_name: user_id });
        await db.delete({ id: getData[0].id });
    } catch (err) {
        console.log(err);
    }
}

//配信ステータス更新(オフライン)
async function OffLine(user_id) {
    var db = await csvdb(config.csvFilePath, ["id", "user_name", "status"], ",");
    await db.edit({ user_name: user_id }, { status: 0 });
}

//配信ステータス更新(オンライン)
async function NowLive(user_id) {
    var db = await csvdb(config.csvFilePath, ["id", "user_name", "status"], ",");
    await db.edit({ user_name: user_id }, { status: 1 });
}

module.exports = {
    addRunner: addRunner,
    delRunner: delRunner,
    OffLine: OffLine,
    NowLive: NowLive,
    runnerList: runnerList,
    backupCsv: backupCsv
}