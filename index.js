const cron = require('node-cron');
const fetch = require('node-fetch');
const csv = require('csvtojson');
const config = require('./config.json');
const discord = require('discord.js');
const crud = require('./crud');
const client = new discord.Client();
const regex = new RegExp(/^[a-zA-Z0-9!\s\_]+$/);
const twitch = "https://www.twitch.tv/";
const method = 'GET';
const headers = {
    Accept: 'application/vnd.twitchtv.v5+json',
    'Client-ID': config.client_id,
    Authorization: config.Authorization
};

client.on('ready', () => {
    console.log(`${client.user.tag} logged in`);

    //csv定時バックアップ(毎週月曜日0:00)
    cron.schedule('0 0 * * 1', function(){
        crud.backupCsv();
    });

    //配信通知(毎分取得)
    cron.schedule('* * * * *', function () {
        csv()
            .fromFile(config.csvFilePath)
            .then((jsonObj) => {
                for (let i = 0; i < jsonObj.length; i++) {
                    fetch(`https://api.twitch.tv/helix/search/channels?query=${jsonObj[i].user_name}&first=1`, { method, headers })
                        .then(res => res.json())
                        .then(res => {
                            //配信状態チェック
                            if (res.data[0].is_live === false) {
                                try {
                                    crud.OffLine(res.data[0].display_name);
                                    return;
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                            //game_idチェック
                            if (!config.game_id.includes(res.data[0].game_id)) {
                                try {
                                    crud.OffLine(res.data[0].display_name);
                                    return;
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                            let checkTags = res.data.filter((v) => {
                                return (v.tags_ids === config.tag);
                            });
                            let dtstr = res.data[0].started_at;
                            let dt = Date.parse(dtstr);
                            let jst = new Date(dt).toLocaleString("ja");
                            //タグチェック
                            if (!checkTags) {
                                try {
                                    crud.OffLine(res.data[0].display_name);
                                    return;
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                            //通知済みの場合は再通知しない
                            if (Number(jsonObj[i].status) === 1) {
                                return;
                            }
                            crud.NowLive(res.data[0].display_name);
                            fetch("https://api.twitch.tv/helix/games?id=" + res.data[0].game_id, { method, headers })
                                .then(response => response.json())
                                .then(response => {
                                    client.channels.cache.get('706670786127069348').send('Now Live!!', {
                                        embed: {
                                            title: res.data[0].title,
                                            description: `Game: ${response.data[0].name}\nLive started at: ${jst}`,
                                            url: twitch + res.data[0].display_name,
                                            color: '9013FE',
                                            timestamp: new Date(),
                                            footer: {
                                                text: "Twitch notification"
                                            },
                                            author: {
                                                name: res.data[0].display_name,
                                                url: twitch + res.data[0].display_name,
                                                icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
                                            },
                                            thumbnail: {
                                                url: res.data[0].thumbnail_url
                                            },
                                        }
                                    }).catch(console.error);
                                })
                        });
                }
            });
    });
});

client.on('message', async message => {
    if (message.author.bot) return;

    if (message.content === 'hi') {
        message.channel.send('hi!');
    }

    if (message.content.indexOf(config.prefix) !== 0) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift()

    // 配信者一覧表示
    if (command === "runnerList") {
        try {
            crud.runnerList().then(result => {
                message.channel.send(`--配信者リスト--\n[${result}]`);
            });
        } catch (err) {
            console.log(err);
        }
    }

    // 配信者登録コマンド
    if (command === "addRunner") {
        var add_id = args.join(" ");
        if (!regex.test(add_id)) {
            message.channel.send('半角英数字以外が入力されています。\n設定 > プロフィール設定のユーザー名を入力してください。');
            return;
        }
        try {
            crud.addRunner(add_id).then(result => {
                if(result == 'not exists'){
                    message.channel.send(`配信者リストへ ${add_id} が登録されました。`);
                } else {
                    message.channel.send(`${add_id} は既に登録されています。`);
                }
            });
        } catch (err) {
            console.log(err);
        }

    }

    //配信者削除コマンド
    if (command === "delRunner") {
        let del_id = args.join(" ");
        if (!regex.test(del_id)) {
            message.channel.send('半角英数字以外が入力されています。');
            return;
        }
        try {
            crud.delRunner(del_id).then(result => {
                if(result == 'exists'){
                    message.channel.send(`配信者リストから ${del_id} が削除されました。`);
                } else {
                    message.channel.send(`${del_id} は登録されていません。`);
                }
            });
        } catch (err) {
            console.log(err);
        }
    }
});

client.login(config.token);